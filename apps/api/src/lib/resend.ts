import { env } from '../config/env';

interface ResendErrorResponse {
  message?: string;
}

export class EmailDeliveryConfigurationError extends Error {
  constructor() {
    super('Email delivery is not configured. Set RESEND_API_KEY to enable email sign-in.');
    this.name = 'EmailDeliveryConfigurationError';
  }
}

export async function sendEmailOtp(email: string, otp: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new EmailDeliveryConfigurationError();
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `ChopSave <${env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: `${otp} is your ChopSave verification code`,
      text: `Your ChopSave verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
      html: `<p>Your ChopSave verification code is <strong style="font-size: 24px; letter-spacing: 0.15em;">${otp}</strong>.</p><p>It expires in 5 minutes. Do not share this code.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ResendErrorResponse;
    throw new Error(`Email delivery failed (${response.status}): ${body.message ?? 'Unknown error'}`);
  }
}
