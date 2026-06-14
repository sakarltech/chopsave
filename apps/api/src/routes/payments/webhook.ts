import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { verifyWebhookSignature } from '../../lib/paystack';
import { pickupReminderQueue, notificationDispatchQueue } from '../../plugins/queue';
import { NotificationType } from '@chopsave/shared';

export async function paystackWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();

  // Verify signature
  const signature = request.headers['x-paystack-signature'] as string;
  const rawBody = JSON.stringify(request.body);

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    reply.status(401).send({ error: 'Invalid webhook signature' });
    return;
  }

  const event = request.body as { event: string; data: { reference: string; status: string; amount: number; metadata?: Record<string, unknown> } };

  if (event.event === 'charge.success') {
    const { reference } = event.data;

    // Idempotency check — skip if already processed
    const existing = await pool.query(
      `SELECT id, status FROM payments WHERE gateway_ref = $1`,
      [reference],
    );
    if (existing.rows.length === 0) {
      reply.status(200).send({ message: 'ok' });
      return;
    }
    if (existing.rows[0].status === 'successful') {
      // Already processed — idempotent
      reply.status(200).send({ message: 'already processed' });
      return;
    }

    // Update payment
    await pool.query(
      `UPDATE payments SET status = 'successful', confirmed_at = NOW() WHERE gateway_ref = $1`,
      [reference],
    );

    // Get reservation ID from payment
    const paymentResult = await pool.query(
      `SELECT reservation_id FROM payments WHERE gateway_ref = $1`,
      [reference],
    );
    const reservationId = paymentResult.rows[0].reservation_id;

    // Update reservation status to confirmed
    await pool.query(
      `UPDATE reservations SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
      [reservationId],
    );

    // Fetch reservation details for notifications
    const resResult = await pool.query(
      `SELECT r.*, l.pickup_start, l.pickup_end, b.name AS business_name, b.user_id AS business_owner_id
       FROM reservations r
       JOIN listings l ON l.id = r.listing_id
       JOIN businesses b ON b.id = r.business_id
       WHERE r.id = $1`,
      [reservationId],
    );
    const reservation = resResult.rows[0];

    // Queue pickup reminders
    const pickupStart = new Date(reservation.pickup_start);
    const pickupEnd = new Date(reservation.pickup_end);
    const now = Date.now();

    const reminder60Delay = pickupStart.getTime() - now - 60 * 60 * 1000;
    if (reminder60Delay > 0) {
      await pickupReminderQueue.add('reminder-60min', { reservationId }, { delay: reminder60Delay });
    }

    const reminder30Delay = pickupEnd.getTime() - now - 30 * 60 * 1000;
    if (reminder30Delay > 0) {
      await pickupReminderQueue.add('reminder-30min', { reservationId }, { delay: reminder30Delay });
    }

    // Notify consumer: reservation confirmed
    await notificationDispatchQueue.add('reservation-confirmed', {
      userId: reservation.consumer_id,
      type: NotificationType.RESERVATION_CONFIRMED,
      title: 'Reservation Confirmed!',
      body: `Your pickup code is ${reservation.pickup_code}. Collect from ${reservation.business_name}.`,
      channels: ['push', 'sms'],
      payload: { reservationId, pickupCode: reservation.pickup_code },
    });

    // Notify business: new reservation
    await notificationDispatchQueue.add('new-reservation-business', {
      userId: reservation.business_owner_id,
      type: NotificationType.RESERVATION_CONFIRMED,
      title: 'New Reservation!',
      body: `A customer reserved ${reservation.quantity} item(s). Pickup code ends in ...${reservation.pickup_code.slice(-4)}`,
      channels: ['push'],
    });
  }

  // Always respond 200 to Paystack
  reply.status(200).send({ message: 'ok' });
}
