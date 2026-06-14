import { FastifyInstance } from 'fastify';
import { getMeHandler, updateMeHandler, deleteMeHandler, updateNotifPrefsHandler } from './me';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  // All user routes require authentication
  app.addHook('preHandler', app.authenticate);

  app.get('/users/me', getMeHandler);
  app.patch('/users/me', updateMeHandler);
  app.delete('/users/me', deleteMeHandler);
  app.patch('/users/me/notifications', updateNotifPrefsHandler);
}
