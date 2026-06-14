import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { initiateRefund } from '../../lib/paystack';

// POST /reservations/:id/cancel
export async function cancelReservationHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;

  // Fetch reservation
  const resResult = await pool.query(
    `SELECT r.*, l.pickup_start
     FROM reservations r
     JOIN listings l ON l.id = r.listing_id
     WHERE r.id = $1 AND r.consumer_id = $2`,
    [id, userId],
  );

  if (resResult.rows.length === 0) {
    reply.status(404).send({ error: 'Reservation not found' });
    return;
  }

  const reservation = resResult.rows[0];

  if (!['pending_payment', 'confirmed'].includes(reservation.status)) {
    reply.status(409).send({ error: `Cannot cancel a reservation with status: ${reservation.status}` });
    return;
  }

  const now = new Date();
  const pickupStart = new Date(reservation.pickup_start);
  const hoursBeforePickup = (pickupStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursBeforePickup > 1) {
    // Full refund — more than 1 hour before pickup
    // Find payment for this reservation
    const payment = await pool.query(
      `SELECT gateway_ref FROM payments WHERE reservation_id = $1 AND status = 'successful' LIMIT 1`,
      [id],
    );

    if (payment.rows.length > 0 && payment.rows[0].gateway_ref) {
      try {
        await initiateRefund({ transactionReference: payment.rows[0].gateway_ref });
      } catch (error) {
        request.log.error(error, 'Refund initiation failed');
        // Continue with cancellation — refund will be retried
      }
    }

    // Restore quantity
    await pool.query(
      `UPDATE listings SET quantity_remaining = quantity_remaining + $1, updated_at = NOW() WHERE id = $2`,
      [reservation.quantity, reservation.listing_id],
    );
    // If listing was sold_out, reactivate
    await pool.query(
      `UPDATE listings SET status = 'active' WHERE id = $1 AND status = 'sold_out'`,
      [reservation.listing_id],
    );

    await pool.query(
      `UPDATE reservations SET status = 'refunded', cancelled_at = NOW(), cancel_reason = 'Cancelled by consumer (>1hr before pickup)', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    reply.status(200).send({ status: 'refunded', message: 'Reservation cancelled. Full refund initiated.' });
  } else {
    // No refund — less than 1 hour before pickup
    await pool.query(
      `UPDATE reservations SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'Cancelled by consumer (<1hr before pickup, no refund)', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    // Do NOT restore quantity — food is already prepared
    reply.status(200).send({ status: 'cancelled', message: 'Reservation cancelled. No refund (within 1 hour of pickup).' });
  }
}
