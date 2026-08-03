import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES } from '../plugins/queue';
import { sendPush } from '../lib/fcm';
import { sendSms } from '../lib/termii';

interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  body: string;
  channels: ('push' | 'sms' | 'in_app')[];
  payload?: Record<string, unknown>;
}

const worker = new Worker(
  QUEUE_NAMES.NOTIFICATION_DISPATCH,
  async (job: Job<NotificationJobData>) => {
    const pool = getPool();
    const { userId, type, title, body, channels, payload } = job.data;

    // Fetch user for FCM token, phone, and notification preferences
    const userResult = await pool.query(
      `SELECT fcm_token, phone, notif_prefs FROM users WHERE id = $1 AND status = 'active'`,
      [userId],
    );

    if (userResult.rows.length === 0) return;
    const user = userResult.rows[0];

    // Check notification preferences
    const prefs = user.notif_prefs as Record<string, boolean>;
    if (prefs[type] === false) {
      // User has opted out of this notification type — still write in_app record
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, payload, channel, sent_at)
         VALUES ($1, $2, $3, $4, $5, 'in_app', NOW())`,
        [userId, type, title, body, JSON.stringify(payload ?? {})],
      );
      return;
    }

    // Send via requested channels
    for (const channel of channels) {
      try {
        if (channel === 'push' && user.fcm_token) {
          await sendPush({
            token: user.fcm_token,
            title,
            body,
            data: payload ? Object.fromEntries(
              Object.entries(payload).map(([k, v]) => [k, String(v)]),
            ) : undefined,
          });
        } else if (channel === 'sms' && user.phone) {
          await sendSms(user.phone, `${title}: ${body}`);
        }

        // Record in notifications table
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, body, payload, channel, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [userId, type, title, body, JSON.stringify(payload ?? {}), channel],
        );
      } catch (error) {
        console.error(`[notification-dispatch] Failed to send ${channel} to ${userId}:`, error);
        // If push fails, fall back to SMS for critical notifications
        if (channel === 'push' && user.phone && !channels.includes('sms')) {
          try {
            await sendSms(user.phone, `${title}: ${body}`);
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, body, payload, channel, sent_at)
               VALUES ($1, $2, $3, $4, $5, 'sms', NOW())`,
              [userId, type, title, body, JSON.stringify(payload ?? {})],
            );
          } catch (smsError) {
            console.error(`[notification-dispatch] SMS fallback also failed:`, smsError);
          }
        }
      }
    }

    // Always write in_app notification
    if (!channels.includes('in_app')) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, payload, channel, sent_at)
         VALUES ($1, $2, $3, $4, $5, 'in_app', NOW())`,
        [userId, type, title, body, JSON.stringify(payload ?? {})],
      );
    }
  },
  { connection: getRedis() as any, concurrency: 10 },
);

worker.on('failed', (job, err) => {
  console.error(`[notification-dispatch] Job ${job?.id} failed:`, err);
});

export default worker;
