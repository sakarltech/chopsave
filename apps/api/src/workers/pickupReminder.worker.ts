import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES, notificationDispatchQueue } from '../plugins/queue';
import { NotificationType } from '@chopsave/shared';

interface ReminderJobData {
  reservationId: string;
}

const worker = new Worker(
  QUEUE_NAMES.PICKUP_REMINDER,
  async (job: Job<ReminderJobData>) => {
    const pool = getPool();
    const { reservationId } = job.data;

    // Fetch reservation — only send if still confirmed or ready
    const result = await pool.query(
      `SELECT r.id, r.consumer_id, r.status, r.pickup_code,
              l.pickup_start, l.pickup_end,
              b.name AS business_name, b.address AS business_address
       FROM reservations r
       JOIN listings l ON l.id = r.listing_id
       JOIN businesses b ON b.id = r.business_id
       WHERE r.id = $1`,
      [reservationId],
    );

    if (result.rows.length === 0) return;
    const reservation = result.rows[0];

    // Only send reminder if reservation is still active
    if (!['confirmed', 'ready'].includes(reservation.status)) return;

    const isCloseReminder = job.name === 'reminder-30min';
    const type = isCloseReminder
      ? NotificationType.PICKUP_REMINDER_30
      : NotificationType.PICKUP_REMINDER_60;

    const title = isCloseReminder
      ? 'Pickup Window Closing Soon!'
      : 'Pickup Reminder';

    const body = isCloseReminder
      ? `Your pickup window at ${reservation.business_name} closes soon. Don't forget to collect!`
      : `Reminder: collect your order from ${reservation.business_name} at ${reservation.business_address}.`;

    await notificationDispatchQueue.add('pickup-reminder', {
      userId: reservation.consumer_id,
      type,
      title,
      body,
      channels: ['push'],
      payload: { reservationId, pickupCode: reservation.pickup_code },
    });
  },
  { connection: getRedis() },
);

worker.on('failed', (job, err) => {
  console.error(`[pickup-reminder] Job ${job?.id} failed:`, err);
});

export default worker;
