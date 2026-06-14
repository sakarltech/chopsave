import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES } from '../plugins/queue';

const worker = new Worker(
  QUEUE_NAMES.PENDING_PAYMENT_EXPIRY,
  async (_job: Job) => {
    const pool = getPool();
    const redis = getRedis();

    // Find reservations stuck in pending_payment for > 10 minutes
    const result = await pool.query(
      `SELECT r.id, r.listing_id, r.quantity, l.business_id
       FROM reservations r
       JOIN listings l ON l.id = r.listing_id
       WHERE r.status = 'pending_payment'
       AND r.created_at < NOW() - INTERVAL '10 minutes'`,
    );

    for (const row of result.rows) {
      // Cancel reservation
      await pool.query(
        `UPDATE reservations SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'Payment timeout', updated_at = NOW() WHERE id = $1`,
        [row.id],
      );

      // Restore quantity
      await pool.query(
        `UPDATE listings SET quantity_remaining = quantity_remaining + $1, updated_at = NOW() WHERE id = $2`,
        [row.quantity, row.listing_id],
      );

      // Reactivate if was sold out
      await pool.query(
        `UPDATE listings SET status = 'active' WHERE id = $1 AND status = 'sold_out'`,
        [row.listing_id],
      );

      // Get city for SSE event
      const bizResult = await pool.query(`SELECT city FROM businesses WHERE id = $1`, [row.business_id]);
      const city = bizResult.rows[0]?.city;
      if (city) {
        await redis.publish(`channel:listings:${city}`, JSON.stringify({
          event: 'listing.quantity_update',
          data: { listingId: row.listing_id, city },
        }));
      }
    }

    if (result.rows.length > 0) {
      console.log(`[pending-payment-expiry] Cancelled ${result.rows.length} expired reservation(s)`);
    }
  },
  { connection: getRedis() },
);

worker.on('failed', (job, err) => {
  console.error(`[pending-payment-expiry] Job ${job?.id} failed:`, err);
});

export default worker;
