import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES, notificationDispatchQueue } from '../plugins/queue';
import { NotificationType } from '@chopsave/shared';

const SUSPENSION_DAYS = 7;
const NO_SHOW_THRESHOLD = 3;

const worker = new Worker(
  QUEUE_NAMES.NO_SHOW_SUSPENSION,
  async (_job: Job) => {
    const pool = getPool();

    // Find consumers with 3+ no-shows in the last 30 days who are NOT already suspended
    const result = await pool.query(
      `SELECT id, no_show_count FROM users
       WHERE role = 'consumer'
       AND status = 'active'
       AND no_show_count >= $1
       AND (suspended_until IS NULL OR suspended_until < NOW())`,
      [NO_SHOW_THRESHOLD],
    );

    for (const user of result.rows) {
      const suspendedUntil = new Date(Date.now() + SUSPENSION_DAYS * 24 * 60 * 60 * 1000);

      await pool.query(
        `UPDATE users SET suspended_until = $1, updated_at = NOW() WHERE id = $2`,
        [suspendedUntil, user.id],
      );

      // Reset no-show count after suspension applied
      await pool.query(
        `UPDATE users SET no_show_count = 0, no_show_window_start = NOW(), updated_at = NOW() WHERE id = $1`,
        [user.id],
      );

      // Notify user
      await notificationDispatchQueue.add('account-suspended', {
        userId: user.id,
        type: NotificationType.ACCOUNT_SUSPENDED,
        title: 'Account Restricted',
        body: `Your ability to make reservations has been suspended for ${SUSPENSION_DAYS} days due to multiple missed pickups.`,
        channels: ['push', 'sms'],
      });
    }

    if (result.rows.length > 0) {
      console.log(`[no-show-suspension] Suspended ${result.rows.length} consumer(s)`);
    }
  },
  { connection: getRedis() },
);

worker.on('failed', (job, err) => {
  console.error(`[no-show-suspension] Job ${job?.id} failed:`, err);
});

export default worker;
