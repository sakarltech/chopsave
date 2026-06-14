import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

// GET /admin/config
export async function getConfigHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const pool = getPool();
  const result = await pool.query(`SELECT key, value, description, updated_at FROM system_config ORDER BY key`);
  reply.status(200).send({ config: result.rows });
}

// PATCH /admin/config/:key
export async function updateConfigHandler(
  request: FastifyRequest<{ Params: { key: string }; Body: { value: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const adminId = request.user!.id;
  const { key } = request.params;
  const { value } = request.body;

  if (!value) { reply.status(422).send({ error: 'value is required' }); return; }

  // Validate commission rate range
  if (key === 'default_commission_rate') {
    const rate = parseFloat(value);
    if (rate < 15 || rate > 20) { reply.status(422).send({ error: 'Commission rate must be 15-20' }); return; }
  }

  const result = await pool.query(
    `UPDATE system_config SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3 RETURNING *`,
    [value, adminId, key],
  );
  if (result.rows.length === 0) { reply.status(404).send({ error: 'Config key not found' }); return; }

  reply.status(200).send({ key: result.rows[0].key, value: result.rows[0].value, updatedAt: result.rows[0].updated_at });
}
