import { env } from '../config/env';

const PAYSTACK_BASE = 'https://api.paystack.co';

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    transaction: { reference: string };
    amount: number;
  };
}

/**
 * Initialize a Paystack transaction.
 * Amount is in kobo (NGN * 100).
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo
  reference: string;
  callbackUrl?: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse['data']> {
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: params.channels ?? ['card', 'bank', 'ussd', 'bank_transfer'],
      metadata: params.metadata,
    }),
  });

  const data = (await response.json()) as PaystackInitResponse;
  if (!data.status) {
    throw new Error(`Paystack init failed: ${data.message}`);
  }
  return data.data;
}

/**
 * Initiate a refund via Paystack.
 * Amount is in kobo.
 */
export async function initiateRefund(params: {
  transactionReference: string;
  amount?: number; // partial refund in kobo, omit for full
}): Promise<PaystackRefundResponse['data']> {
  const response = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      transaction: params.transactionReference,
      amount: params.amount,
    }),
  });

  const data = (await response.json()) as PaystackRefundResponse;
  if (!data.status) {
    throw new Error(`Paystack refund failed: ${data.message}`);
  }
  return data.data;
}

/**
 * Verify Paystack webhook signature (HMAC-SHA512).
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return hash === signature;
}
