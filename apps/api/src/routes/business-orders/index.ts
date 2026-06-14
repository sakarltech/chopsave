import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { getBusinessOrdersHandler, markOrderReadyHandler } from './orders';

export async function businessOrderRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', requireRole('business_owner'));

  app.get('/business/orders', getBusinessOrdersHandler);
  app.patch('/business/orders/:id/ready', markOrderReadyHandler);
}
