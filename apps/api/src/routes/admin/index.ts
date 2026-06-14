import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { getPendingBusinesses, approveBusiness, rejectBusiness } from './businesses';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // All admin routes require auth + admin role
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', requireRole('admin'));

  // Business verification
  app.get('/admin/businesses/pending', getPendingBusinesses);
  app.post('/admin/businesses/:id/approve', approveBusiness);
  app.post('/admin/businesses/:id/reject', rejectBusiness);
}
