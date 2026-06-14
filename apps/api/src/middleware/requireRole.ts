import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Create a preHandler that checks the authenticated user has one of the specified roles.
 * Must be used AFTER app.authenticate has attached `request.user`.
 */
export function requireRole(...allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }
  };
}
