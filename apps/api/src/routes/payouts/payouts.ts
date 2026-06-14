import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

interface RequestPayoutBody {
  amount: number;
  bankCode: string;
  accountNumber: string;
}

// POST /payouts/request
export async function requestPayoutHandler(
  request: FastifyRequest<{ Body: RequestPayoutBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { amount, bankCode, accountNumber } = request.body;

  // Get business
  const bizResult = await pool.query(`SELECT id, payout_balance FROM businesses WHERE user_id = $1`, [userId]);
  if (bizResult.rows.length === 0) { reply.status(404).send({ error: 'Business not found' }); return; }
  const business = bizResult.rows[0];
  const balance = parseFloat(business.payout_balance);

  if (!amount || amount < 500) { reply.status(422).send({ error: 'Minimum payout is ₦500' }); return; }
  if (amount > balance) { reply.status(422).send({ error: `Insufficient balance. Available: ₦${balance.toFixed(2)}` }); return; }

  // Create payout record and deduct from balance
  const bankAccount = { bankCode, accountNumber, last4: accountNumber.slice(-4) };

  await pool.query(
    `UPDATE businesses SET payout_balance = payout_balance - $1, updated_at = NOW() WHERE id = $2`,
    [amount, business.id],
  );

  const result = await pool.query(
    `INSERT INTO payouts (business_id, amount, status, bank_account, gateway)
     VALUES ($1, $2, 'pending', $3, 'paystack') RETURNING *`,
    [business.id, amount, JSON.stringify(bankAccount)],
  );

  reply.status(201).send({
    id: result.rows[0].id,
    amount: parseFloat(result.rows[0].amount),
    status: result.rows[0].status,
    bankAccount: { last4: bankAccount.last4 },
    requestedAt: result.rows[0].requested_at,
    message: 'Payout requested. Will be processed within 24 hours.',
  });
}

// GET /payouts/history
export async function getPayoutHistoryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;

  const bizResult = await pool.query(`SELECT id, payout_balance FROM businesses WHERE user_id = $1`, [userId]);
  if (bizResult.rows.length === 0) { reply.status(404).send({ error: 'Business not found' }); return; }

  const result = await pool.query(
    `SELECT id, amount, status, bank_account, gateway_ref, failure_reason, requested_at, processed_at, completed_at
     FROM payouts WHERE business_id = $1 ORDER BY requested_at DESC LIMIT 50`,
    [bizResult.rows[0].id],
  );

  reply.status(200).send({
    balance: parseFloat(bizResult.rows[0].payout_balance),
    payouts: result.rows.map((row) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      status: row.status,
      bankAccountLast4: row.bank_account?.last4 ?? '****',
      gatewayRef: row.gateway_ref,
      failureReason: row.failure_reason,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
      completedAt: row.completed_at,
    })),
  });
}
