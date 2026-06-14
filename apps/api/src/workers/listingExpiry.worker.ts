import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES } from '../plugins/queue';

const worker = new Worker(
  QUEUE_NAMES.LISTING_EXPIRY,
  async (_job: Job) => {
    const pool = getPool();
    const redis = getRedis();

    // Find and expire active listings past their pickup window
    const result = await pool.query(
      `UPDATE listings
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND pickup_end < NOW()
       RETURNING id, business_id`,
    );

    // Publish events for SSE
    for (const row of result.rows) {
      // Get city for the business
      const bizResult = await pool.query(`SELECT city FROM businesses WHERE id = $1`, [row.business_id]);
      const city = bizResult.rows[0]?.city;
      if (city) {
        await redis.publish(`channel:listings:${city}`, JSON.stringify({
          event: 'listing.expired',
          data: { listingId: row.id, city },
        }));
      }
    }

    if (result.rows.length > 0) {
      console.log(`[listing-expiry] Expired ${result.rows.length} listing(s)`);
    }
  },
  { connection: getRedis() },
);

worker.on('failed', (job, err) => {
  console.error(`[listing-expiry] Job ${job?.id} failed:`, err);
});

export default worker;
