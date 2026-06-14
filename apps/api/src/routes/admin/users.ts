import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { notificationDispatchQueue } from '../../plugins/queue';
import { NotificationType } from '@chopsave/shared';

// POST /admin/users/:id/suspend
export async function suspendUserHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: { reason: string; days?: number } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const adminId = request.user!.id;
  const { id } = request.params;
  const { reason, days } = request.body;

  if (!reason || reason.length < 5) { reply.status(422).send({ error: 'reason is required' }); return; }

  const suspendDays = days ?? 30;
  const suspendedUntil = new Date(Date.now() + suspendDays * 24 * 60 * 60 * 1000);

  await pool.query(`UPDATE users SET status = 'suspended', suspended_until = $1, updated_at = NOW() WHERE id = $2`, [suspendedUntil, id]);
  await pool.query(
    `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason) VALUES ($1, 'suspend_user', 'user', $2, $3)`,
    [adminId, id, reason],
  );

  await notificationDispatchQueue.add('user-suspended', {
    userId: id, type: NotificationType.ACCOUNT_SUSPENDED, title: 'Account Suspended',
    body: `Your account has been suspended. Reason: ${reason}`, channels: ['push', 'sms'],
  });

  reply.status(200).send({ id, status: 'suspended', suspendedUntil, message: 'User suspended' });
}

// POST /admin/users/:id/ban
export async function banUserHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: { reason: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const adminId = request.user!.id;
  const { id } = request.params;
  const { reason } = request.body;

  if (!reason) { reply.status(422).send({ error: 'reason is required' }); return; }

  await pool.query(`UPDATE users SET status = 'deleted', deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [id]);
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [id]);
  await pool.query(
    `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason) VALUES ($1, 'ban_user', 'user', $2, $3)`,
    [adminId, id, reason],
  );

  reply.status(200).send({ id, status: 'banned', message: 'User permanently banned' });
}
