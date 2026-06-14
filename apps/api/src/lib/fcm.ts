import { env } from '../config/env';

interface FcmMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification via Firebase Cloud Messaging.
 * Uses the FCM HTTP v1 API.
 */
export async function sendPush(params: FcmMessage): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Parse service account from env
    const serviceAccount = JSON.parse(env.FCM_SERVICE_ACCOUNT);

    // For MVP, use the legacy FCM HTTP API (simpler, no OAuth token management)
    // In production, migrate to FCM HTTP v1 with service account OAuth
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${serviceAccount.server_key || serviceAccount.api_key || ''}`,
      },
      body: JSON.stringify({
        to: params.token,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data ?? {},
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`FCM send failed (${response.status}): ${errorBody}`);
      return { success: false };
    }

    const result = (await response.json()) as { message_id?: string; success?: number; failure?: number };
    return {
      success: (result.success ?? 0) > 0,
      messageId: result.message_id,
    };
  } catch (error) {
    console.error('FCM send error:', error);
    return { success: false };
  }
}

/**
 * Send push notification to multiple tokens (batch).
 */
export async function sendPushBatch(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;

  for (const token of tokens) {
    const result = await sendPush({ token, title, body, data });
    if (result.success) successCount++;
    else failureCount++;
  }

  return { successCount, failureCount };
}
