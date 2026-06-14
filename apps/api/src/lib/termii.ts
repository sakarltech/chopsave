import { env } from '../config/env';

interface TermiiSendResponse {
  message_id: string;
  message: string;
  balance: number;
  user: string;
}

/**
 * Send an SMS via Termii API.
 * https://developers.termii.com/messaging
 */
export async function sendSms(phone: string, message: string): Promise<TermiiSendResponse> {
  const response = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      from: 'ChopSave',
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: env.TERMII_API_KEY,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Termii SMS failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<TermiiSendResponse>;
}
