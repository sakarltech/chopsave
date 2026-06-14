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
    const client = await pool.connect();
    let committed = false;

    try {
      await client.query('BEGIN');

      // Idempotency check — skip if already processed
      const existing = await client.query(
        `SELECT id, status, reservation_id FROM payments WHERE gateway_ref = $1 FOR UPDATE`,
        [reference],
      );
      if (existing.rows.length === 0) {
        await client.query('COMMIT');
        reply.status(200).send({ message: 'ok' });
        return;
      }
      if (existing.rows[0].status === 'successful') {
        await client.query('COMMIT');
        reply.status(200).send({ message: 'already processed' });
        return;
      }

      // Update payment
      await client.query(
        `UPDATE payments SET status = 'successful', confirmed_at = NOW() WHERE gateway_ref = $1`,
        [reference],
      );

      const reservationId = existing.rows[0].reservation_id;

      // Update reservation status to confirmed
      await client.query(
        `UPDATE reservations SET status = 'confirmed', updated_at = NOW() WHERE id = $1 AND status = 'pending_payment'`,
        [reservationId],
      );

      // Fetch reservation details for notifications
      const resResult = await client.query(
        `SELECT r.*, l.pickup_start, l.pickup_end, b.name AS business_name, b.user_id AS business_owner_id
         FROM reservations r
         JOIN listings l ON l.id = r.listing_id
         JOIN businesses b ON b.id = r.business_id
         WHERE r.id = $1`,
        [reservationId],
      );
      const reservation = resResult.rows[0];

      await client.query('COMMIT');
      committed = true;

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
    } catch (error) {
      if (!committed) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // Always respond 200 to Paystack
  reply.status(200).send({ message: 'ok' });
}
