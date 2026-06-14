import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { initiatePaymentHandler } from './initiate';
import { paystackWebhookHandler } from './webhook';

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  app.post('/payments/initiate', {
    preHandler: [app.authenticate, requireRole('consumer')],
  }, initiatePaymentHandler);

  // Webhook — public (verified by signature)
  app.post('/payments/webhook/paystack', {
    config: { rawBody: true },
  }, paystackWebhookHandler);
}
