import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { requestPayoutHandler, getPayoutHistoryHandler } from './payouts';
import { getBusinessStatsHandler } from './stats';

export async function payoutRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', requireRole('business_owner'));

  app.post('/payouts/request', requestPayoutHandler);
  app.get('/payouts/history', getPayoutHistoryHandler);
  app.get('/businesses/:id/stats', getBusinessStatsHandler);
}
