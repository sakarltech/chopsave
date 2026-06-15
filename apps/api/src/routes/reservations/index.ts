import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { createReservationHandler } from './create';
import { getReservationsHandler, getReservationDetailHandler } from './list';
import { cancelReservationHandler } from './cancel';
import { collectReservationHandler } from './collect';
import type { CreateReservationBody } from './create';
import type { CollectBody } from './collect';

export async function reservationRoutes(app: FastifyInstance): Promise<void> {
  // Consumer routes
  app.post<{ Body: CreateReservationBody }>('/reservations', {
    preHandler: [app.authenticate, requireRole('consumer')],
  }, createReservationHandler);

  app.get('/reservations', {
    preHandler: [app.authenticate],
  }, getReservationsHandler);

  app.get<{ Params: { id: string } }>('/reservations/:id', {
    preHandler: [app.authenticate],
  }, getReservationDetailHandler);

  app.post<{ Params: { id: string } }>('/reservations/:id/cancel', {
    preHandler: [app.authenticate, requireRole('consumer')],
  }, cancelReservationHandler);

  // Business owner collects
  app.post<{ Params: { id: string }; Body: CollectBody }>('/reservations/:id/collect', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, collectReservationHandler);
}
