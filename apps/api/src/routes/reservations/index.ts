import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { createReservationHandler } from './create';
import { getReservationsHandler, getReservationDetailHandler } from './list';
import { cancelReservationHandler } from './cancel';
import { collectReservationHandler } from './collect';

export async function reservationRoutes(app: FastifyInstance): Promise<void> {
  // Consumer routes
  app.post('/reservations', {
    preHandler: [app.authenticate, requireRole('consumer')],
  }, createReservationHandler);

  app.get('/reservations', {
    preHandler: [app.authenticate],
  }, getReservationsHandler);

  app.get('/reservations/:id', {
    preHandler: [app.authenticate],
  }, getReservationDetailHandler);

  app.post('/reservations/:id/cancel', {
    preHandler: [app.authenticate, requireRole('consumer')],
  }, cancelReservationHandler);

  // Business owner collects
  app.post('/reservations/:id/collect', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, collectReservationHandler);
}
