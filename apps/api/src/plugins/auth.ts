import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { TokenService } from '../services/TokenService';

const tokenService = new TokenService();

// Augment Fastify types to add `user` to request
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      role: string;
    };
  }
}

/**
 * Auth plugin — adds `authenticate` decorator to app.
 * Use: app.addHook('preHandler', app.authenticate) on protected routes.
 */
async function authPlugin(app: FastifyInstance): Promise<void> {
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      reply.status(401).send({ error: 'Invalid or expired access token' });
      return;
    }

    // Attach user to request
    request.user = {
      id: payload.sub,
      role: payload.role,
    };
  });
}

export default fp(authPlugin, { name: 'auth' });

// Augment Fastify instance type
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
