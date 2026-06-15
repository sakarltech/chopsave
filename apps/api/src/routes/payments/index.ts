import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { initiatePaymentHandler } from './initiate';
import { paystackWebhookHandler } from './webhook';
import type { InitiatePaymentBody } from './initiate';

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: InitiatePaymentBody }>('/payments/initiate', {
    preHandler: [app.authenticate, requireRole('consumer')],
  }, initiatePaymentHandler);

  // Webhook — public (verified by signature)
  app.post('/payments/webhook/paystack', {
    config: { rawBody: true },
  }, paystackWebhookHandler);
}
