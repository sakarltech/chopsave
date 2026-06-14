import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenService } from '../../services/TokenService';
import { getPool } from '../../db/pool';

interface RefreshBody {
  refreshToken: string;
}

const tokenService = new TokenService();

export async function refreshHandler(
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    reply.status(422).send({ error: 'refreshToken is required' });
    return;
  }

  // Validate refresh token
  const userId = await tokenService.validateRefreshToken(refreshToken);
  if (!userId) {
    reply.status(401).send({ error: 'Invalid or expired refresh token' });
    return;
  }

  // Fetch user role
  const pool = getPool();
  const result = await pool.query<{ role: string; status: string }>(
    `SELECT role, status FROM users WHERE id = $1`,
    [userId],
  );

  const user = result.rows[0];
  if (!user || user.status !== 'active') {
    reply.status(403).send({ error: 'Account is not active' });
    return;
  }

  // Issue new access token (keep same refresh token — rotate only on explicit request)
  const accessToken = tokenService.generateAccessToken(userId, user.role);

  reply.status(200).send({ accessToken });
}
