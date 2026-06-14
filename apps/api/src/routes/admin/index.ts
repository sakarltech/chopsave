import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { getPendingBusinesses, approveBusiness, rejectBusiness } from './businesses';
import { getAnalyticsHandler } from './analytics';
import { getDisputesHandler, resolveDisputeHandler } from './disputes';
import { suspendUserHandler, banUserHandler } from './users';
import { getConfigHandler, updateConfigHandler } from './config';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // All admin routes require auth + admin role
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', requireRole('admin'));

  // Business verification
  app.get('/admin/businesses/pending', getPendingBusinesses);
  app.post('/admin/businesses/:id/approve', approveBusiness);
  app.post('/admin/businesses/:id/reject', rejectBusiness);

  // Analytics
  app.get('/admin/analytics', getAnalyticsHandler);

  // Disputes
  app.get('/admin/disputes', getDisputesHandler);
  app.post('/admin/disputes/:id/resolve', resolveDisputeHandler);

  // User management
  app.post('/admin/users/:id/suspend', suspendUserHandler);
  app.post('/admin/users/:id/ban', banUserHandler);

  // System config
  app.get('/admin/config', getConfigHandler);
  app.patch('/admin/config/:key', updateConfigHandler);
}
