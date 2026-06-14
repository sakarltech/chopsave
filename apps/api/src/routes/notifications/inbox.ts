import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

// GET /notifications — paginated notification inbox
export async function getNotificationsHandler(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const page = parseInt(request.query.page ?? '1', 10);
  const limit = Math.min(parseInt(request.query.limit ?? '20', 10), 50);
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT id, type, title, body, payload, channel, read, sent_at, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE read = false) as unread
     FROM notifications WHERE user_id = $1`,
    [userId],
  );

  reply.status(200).send({
    notifications: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      payload: row.payload,
      channel: row.channel,
      read: row.read,
      sentAt: row.sent_at,
      createdAt: row.created_at,
    })),
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].total, 10),
      unread: parseInt(countResult.rows[0].unread, 10),
    },
  });
}

// PATCH /notifications/:id/read
export async function markReadHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;

  const result = await pool.query(
    `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Notification not found' });
    return;
  }

  reply.status(200).send({ id, read: true });
}

// PATCH /notifications/read-all
export async function markAllReadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;

  const result = await pool.query(
    `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
    [userId],
  );

  reply.status(200).send({ markedRead: result.rowCount });
}
