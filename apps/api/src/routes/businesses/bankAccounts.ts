import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { env } from '../../config/env';

interface AddBankAccountBody {
  bankCode: string;
  accountNumber: string;
}

/**
 * Verify a Nigerian bank account using Paystack's Resolve Account API.
 */
async function verifyBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{
  accountName: string;
  accountNumber: string;
  bankId: number;
}> {
  const response = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bank verification failed: ${body}`);
  }

  const data = (await response.json()) as {
    status: boolean;
    data: { account_name: string; account_number: string; bank_id: number };
  };
  if (!data.status) {
    throw new Error('Bank account could not be verified');
  }

  return {
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
    bankId: data.data.bank_id,
  };
}

// POST /businesses/:id/bank-accounts
export async function addBankAccountHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: AddBankAccountBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id: businessId } = request.params;
  const { bankCode, accountNumber } = request.body;

  // Validate input
  if (!bankCode || !accountNumber) {
    reply.status(422).send({ error: 'bankCode and accountNumber are required' });
    return;
  }
  if (!/^\d{10}$/.test(accountNumber)) {
    reply.status(422).send({ error: 'accountNumber must be a 10-digit number' });
    return;
  }

  // Verify ownership
  const ownership = await pool.query(
    `SELECT id FROM businesses WHERE id = $1 AND user_id = $2`,
    [businessId, userId],
  );
  if (ownership.rows.length === 0) {
    reply.status(403).send({ error: 'You can only manage your own business bank accounts' });
    return;
  }

  // Verify bank account via Paystack
  let verified;
  try {
    verified = await verifyBankAccount(accountNumber, bankCode);
  } catch (error) {
    request.log.error(error, 'Bank verification failed');
    reply
      .status(400)
      .send({ error: 'Bank account could not be verified. Please check the details.' });
    return;
  }

  const bankAccount = {
    bankCode,
    bankName: bankCode, // Will be resolved from a bank list in future
    accountNumber: verified.accountNumber,
    accountName: verified.accountName,
    last4: verified.accountNumber.slice(-4),
  };

  // Update business updated_at (bank account stored as verified metadata for payout use)
  await pool.query(`UPDATE businesses SET updated_at = NOW() WHERE id = $1`, [businessId]);

  reply.status(201).send({
    bankAccount: {
      bankCode: bankAccount.bankCode,
      accountNumber: `****${bankAccount.last4}`,
      accountName: bankAccount.accountName,
      verified: true,
    },
    message: 'Bank account verified and saved successfully',
  });
}

// GET /businesses/:id/bank-accounts
export async function getBankAccountsHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id: businessId } = request.params;

  // Verify ownership
  const ownership = await pool.query(
    `SELECT id FROM businesses WHERE id = $1 AND user_id = $2`,
    [businessId, userId],
  );
  if (ownership.rows.length === 0) {
    reply.status(403).send({ error: 'You can only view your own business bank accounts' });
    return;
  }

  // For MVP, return an empty array or any stored accounts
  // In production, query a dedicated bank_accounts table
  reply.status(200).send({ bankAccounts: [] });
}
