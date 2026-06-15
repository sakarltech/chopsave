import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenService } from '../../services/TokenService';

export interface LogoutBody {
  refreshToken: string;
}

const tokenService = new TokenService();

export async function logoutHandler(
  request: FastifyRequest<{ Body: LogoutBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    reply.status(422).send({ error: 'refreshToken is required' });
    return;
  }

  await tokenService.revokeRefreshToken(refreshToken);
  reply.status(200).send({ message: 'Logged out successfully' });
}
