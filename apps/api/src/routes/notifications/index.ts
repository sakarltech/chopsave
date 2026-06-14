import { FastifyInstance } from 'fastify';
import { getNotificationsHandler, markReadHandler, markAllReadHandler } from './inbox';

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/notifications', getNotificationsHandler);
  app.patch('/notifications/:id/read', markReadHandler);
  app.patch('/notifications/read-all', markAllReadHandler);
}
