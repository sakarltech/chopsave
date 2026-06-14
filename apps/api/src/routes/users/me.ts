import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

// GET /users/me — Get own profile
export async function getMeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;

  const result = await pool.query(
    `SELECT id, phone, email, full_name, display_name, avatar_url, role, status,
            dietary_prefs, notif_prefs, no_show_count, suspended_until, created_at, updated_at
     FROM users WHERE id = $1 AND status != 'deleted'`,
    [userId],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'User not found' });
    return;
  }

  const user = result.rows[0];
  reply.status(200).send({
    id: user.id,
    phone: user.phone,
    email: user.email,
    fullName: user.full_name,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    status: user.status,
    dietaryPrefs: user.dietary_prefs,
    notifPrefs: user.notif_prefs,
    noShowCount: user.no_show_count,
    suspendedUntil: user.suspended_until,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });
}

// PATCH /users/me — Update profile
interface UpdateMeBody {
  displayName?: string;
  avatarUrl?: string;
  dietaryPrefs?: string[];
  fcmToken?: string;
}

export async function updateMeHandler(
  request: FastifyRequest<{ Body: UpdateMeBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { displayName, avatarUrl, dietaryPrefs, fcmToken } = request.body;

  // Build dynamic SET clause
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (displayName !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    params.push(displayName);
  }
  if (avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    params.push(avatarUrl);
  }
  if (dietaryPrefs !== undefined) {
    updates.push(`dietary_prefs = $${paramIndex++}`);
    params.push(dietaryPrefs);
  }
  if (fcmToken !== undefined) {
    updates.push(`fcm_token = $${paramIndex++}`);
    params.push(fcmToken);
  }

  if (updates.length === 0) {
    reply.status(422).send({ error: 'No fields to update' });
    return;
  }

  updates.push(`updated_at = NOW()`);
  params.push(userId);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} AND status != 'deleted' RETURNING id, display_name, avatar_url, dietary_prefs, fcm_token, updated_at`;

  const result = await pool.query(sql, params);

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'User not found' });
    return;
  }

  const user = result.rows[0];
  reply.status(200).send({
    id: user.id,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    dietaryPrefs: user.dietary_prefs,
    updatedAt: user.updated_at,
  });
}

// DELETE /users/me — Soft-delete account
export async function deleteMeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;

  // Soft-delete: set status to 'deleted', anonymise PII immediately
  // (NDPR compliance — full anonymisation within 30 days)
  await pool.query(
    `UPDATE users SET status = 'deleted', deleted_at = NOW(), updated_at = NOW(),
            phone = NULL, email = NULL, full_name = 'Deleted User',
            display_name = NULL, avatar_url = NULL, dietary_prefs = '{}',
            fcm_token = NULL
     WHERE id = $1`,
    [userId],
  );

  // Revoke all refresh tokens
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);

  reply.status(200).send({ message: 'Account deleted successfully' });
}

// PATCH /users/me/notifications — Update notification preferences
interface NotifPrefsBody {
  notifPrefs: Record<string, boolean>;
}

export async function updateNotifPrefsHandler(
  request: FastifyRequest<{ Body: NotifPrefsBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { notifPrefs } = request.body;

  if (!notifPrefs || typeof notifPrefs !== 'object') {
    reply.status(422).send({ error: 'notifPrefs must be an object of { notificationType: boolean }' });
    return;
  }

  const result = await pool.query(
    `UPDATE users SET notif_prefs = $1, updated_at = NOW() WHERE id = $2 AND status != 'deleted' RETURNING notif_prefs`,
    [JSON.stringify(notifPrefs), userId],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'User not found' });
    return;
  }

  reply.status(200).send({ notifPrefs: result.rows[0].notif_prefs });
}
