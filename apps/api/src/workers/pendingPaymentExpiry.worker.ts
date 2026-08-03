import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES } from '../plugins/queue';

interface PendingPaymentExpiryJob {
  reservationId?: string;
}

const worker = new Worker(
  QUEUE_NAMES.PENDING_PAYMENT_EXPIRY,
  async (job: Job<PendingPaymentExpiryJob>) => {
    const pool = getPool();
    const redis = getRedis();
    const { reservationId } = job.data;

    if (!reservationId) {
      return;
    }

    const client = await pool.connect();
    let committed = false;
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE reservations
         SET status = 'cancelled',
             cancelled_at = NOW(),
             cancel_reason = 'Payment timeout',
             updated_at = NOW()
         WHERE id = $1 AND status = 'pending_payment'
         RETURNING listing_id, quantity`,
        [reservationId],
      );

      const reservation = result.rows[0];
      if (!reservation) {
        await client.query('COMMIT');
        return;
      }

      await client.query(
        `UPDATE listings
         SET quantity_remaining = quantity_remaining + $1,
             status = CASE WHEN status = 'sold_out' THEN 'active' ELSE status END,
             updated_at = NOW()
         WHERE id = $2
         RETURNING business_id`,
        [reservation.quantity, reservation.listing_id],
      );

      const bizResult = await client.query(
        `SELECT b.city
         FROM listings l
         JOIN businesses b ON b.id = l.business_id
         WHERE l.id = $1`,
        [reservation.listing_id],
      );

      await client.query('COMMIT');
      committed = true;

      const city = bizResult.rows[0]?.city;
      if (city) {
        await redis.publish(`channel:listings:${city}`, JSON.stringify({
          event: 'listing.quantity_update',
          data: { listingId: reservation.listing_id, city },
        }));
      }

      console.log(`[pending-payment-expiry] Cancelled expired reservation ${reservationId}`);
    } catch (error) {
      if (!committed) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      client.release();
    }
  },
  { connection: getRedis() as any },
);

worker.on('failed', (job, err) => {
  console.error(`[pending-payment-expiry] Job ${job?.id} failed:`, err);
});

export default worker;
