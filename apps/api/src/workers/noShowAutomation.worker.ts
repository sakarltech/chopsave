import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES } from '../plugins/queue';
import { notificationDispatchQueue } from '../plugins/queue';
import { NotificationType } from '@chopsave/shared';

const worker = new Worker(
  QUEUE_NAMES.NO_SHOW_AUTOMATION,
  async (_job: Job) => {
    const pool = getPool();

    // Find reservations past pickup_end that are still confirmed or ready
    const result = await pool.query(
      `SELECT r.id, r.consumer_id, r.business_id, r.quantity, l.pickup_end,
              b.user_id AS business_owner_id
       FROM reservations r
       JOIN listings l ON l.id = r.listing_id
       JOIN businesses b ON b.id = r.business_id
       WHERE r.status IN ('confirmed', 'ready')
       AND l.pickup_end < NOW()`,
    );

    for (const row of result.rows) {
      // Mark as no_show
      await pool.query(
        `UPDATE reservations SET status = 'no_show', no_show_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [row.id],
      );

      // Increment consumer no-show count
      await pool.query(
        `UPDATE users SET no_show_count = no_show_count + 1, updated_at = NOW() WHERE id = $1`,
        [row.consumer_id],
      );

      // Notify consumer
      await notificationDispatchQueue.add('no-show', {
        userId: row.consumer_id,
        type: NotificationType.NO_SHOW,
        title: 'Missed Pickup',
        body: 'You did not collect your order within the pickup window. Payment forfeited.',
        channels: ['push'],
        payload: { reservationId: row.id },
      });

      // Notify business
      await notificationDispatchQueue.add('no-show-business', {
        userId: row.business_owner_id,
        type: NotificationType.NO_SHOW,
        title: 'Customer No-Show',
        body: 'A customer did not collect their reservation.',
        channels: ['push'],
        payload: { reservationId: row.id },
      });
    }

    if (result.rows.length > 0) {
      console.log(`[no-show-automation] Marked ${result.rows.length} reservation(s) as no-show`);
    }
  },
  { connection: getRedis() as any },
);

worker.on('failed', (job, err) => {
  console.error(`[no-show-automation] Job ${job?.id} failed:`, err);
});

export default worker;
