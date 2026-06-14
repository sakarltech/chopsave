import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { notificationDispatchQueue } from '../../plugins/queue';
import { NotificationType } from '@chopsave/shared';

interface CollectBody {
  pickupCode: string;
}

// POST /reservations/:id/collect — Business validates pickup code and confirms collection
export async function collectReservationHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: CollectBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;
  const { pickupCode } = request.body;

  if (!pickupCode) {
    reply.status(422).send({ error: 'pickupCode is required' });
    return;
  }

  // Fetch reservation and verify business ownership
  const result = await pool.query(
    `SELECT r.*, b.user_id AS business_owner_id, b.id AS biz_id, l.weight_kg
     FROM reservations r
     JOIN businesses b ON b.id = r.business_id
     JOIN listings l ON l.id = r.listing_id
     WHERE r.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Reservation not found' });
    return;
  }

  const reservation = result.rows[0];

  // Verify the business owner is making this request
  if (reservation.business_owner_id !== userId) {
    reply.status(403).send({ error: 'Only the business owner can confirm collection' });
    return;
  }

  // Check reservation status
  if (!['confirmed', 'ready'].includes(reservation.status)) {
    reply.status(409).send({ error: `Cannot collect reservation with status: ${reservation.status}` });
    return;
  }

  // Validate pickup code
  if (reservation.pickup_code !== pickupCode.toUpperCase()) {
    reply.status(422).send({ error: 'Invalid pickup code' });
    return;
  }

  // Mark as completed
  await pool.query(
    `UPDATE reservations SET status = 'completed', collected_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [id],
  );

  // Add payout to business balance
  await pool.query(
    `UPDATE businesses SET payout_balance = payout_balance + $1, updated_at = NOW() WHERE id = $2`,
    [parseFloat(reservation.payout_amt), reservation.biz_id],
  );

  // Update business impact stats
  const weightKg = parseFloat(reservation.weight_kg || '0.5');
  const foodSaved = weightKg * reservation.quantity;
  const co2Factor = 2.5; // from system_config default
  const co2Saved = foodSaved * co2Factor;

  await pool.query(
    `UPDATE businesses SET food_saved_kg = food_saved_kg + $1, co2_saved_kg = co2_saved_kg + $2, updated_at = NOW() WHERE id = $3`,
    [foodSaved, co2Saved, reservation.biz_id],
  );

  // Notify consumer: order collected, prompt to rate
  await notificationDispatchQueue.add('order-collected', {
    userId: reservation.consumer_id,
    type: NotificationType.ORDER_COLLECTED,
    title: 'Order Collected!',
    body: 'Enjoy your food! Please rate your experience.',
    channels: ['push'],
    payload: { reservationId: id },
  });

  reply.status(200).send({
    id,
    status: 'completed',
    collectedAt: new Date().toISOString(),
    message: 'Collection confirmed successfully',
  });
}
