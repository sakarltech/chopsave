import { Worker, Job } from 'bullmq';
import { getPool } from '../db/pool';
import { getRedis } from '../plugins/redis';
import { QUEUE_NAMES, notificationDispatchQueue } from '../plugins/queue';
import { NotificationType } from '@chopsave/shared';
import { env } from '../config/env';

const worker = new Worker(
  QUEUE_NAMES.PAYOUT_SETTLEMENT,
  async (_job: Job) => {
    const pool = getPool();

    // Find pending payouts
    const result = await pool.query(
      `SELECT p.id, p.business_id, p.amount, p.bank_account, b.user_id
       FROM payouts p JOIN businesses b ON b.id = p.business_id
       WHERE p.status = 'pending'
       ORDER BY p.requested_at ASC LIMIT 50`,
    );

    for (const payout of result.rows) {
      try {
        // Call Paystack Transfer API
        const bankAccount = payout.bank_account;
        const response = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
          body: JSON.stringify({
            source: 'balance',
            amount: Math.round(parseFloat(payout.amount) * 100), // kobo
            recipient: bankAccount.accountNumber, // In production, use a recipient code
            reason: `ChopSave payout ${payout.id}`,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { data: { transfer_code: string } };
          await pool.query(
            `UPDATE payouts SET status = 'processing', gateway_ref = $1, processed_at = NOW() WHERE id = $2`,
            [data.data.transfer_code, payout.id],
          );
        } else {
          const errorBody = await response.text();
          await pool.query(
            `UPDATE payouts SET status = 'failed', failure_reason = $1 WHERE id = $2`,
            [errorBody, payout.id],
          );
          // Restore balance
          await pool.query(
            `UPDATE businesses SET payout_balance = payout_balance + $1 WHERE id = $2`,
            [parseFloat(payout.amount), payout.business_id],
          );
          // Notify
          await notificationDispatchQueue.add('payout-failed', {
            userId: payout.user_id,
            type: NotificationType.PAYOUT_FAILED,
            title: 'Payout Failed',
            body: 'Your payout could not be processed. Amount has been restored to your balance.',
            channels: ['push', 'sms'],
          });
        }
      } catch (error) {
        console.error(`[payout-settlement] Error processing payout ${payout.id}:`, error);
      }
    }

    if (result.rows.length > 0) {
      console.log(`[payout-settlement] Processed ${result.rows.length} payout(s)`);
    }
  },
  { connection: getRedis() as any },
);

worker.on('failed', (job, err) => {
  console.error(`[payout-settlement] Job ${job?.id} failed:`, err);
});

export default worker;
