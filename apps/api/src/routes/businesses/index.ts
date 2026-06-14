import { FastifyInstance } from 'fastify';
import { registerBusinessHandler } from './register';
import { getBusinessHandler, updateBusinessHandler } from './profile';
import { addBankAccountHandler, getBankAccountsHandler } from './bankAccounts';
import { requireRole } from '../../middleware/requireRole';

export async function businessRoutes(app: FastifyInstance): Promise<void> {
  // Public
  app.get('/businesses/:id', getBusinessHandler);

  // Authenticated - any role (will upgrade to business_owner)
  app.post('/businesses/register', {
    preHandler: [app.authenticate],
  }, registerBusinessHandler);

  // Business owner only
  app.patch('/businesses/:id', {
    preHandler: [app.authenticate, requireRole('business_owner', 'admin')],
  }, updateBusinessHandler);

  // Bank accounts (business owner only)
  app.post('/businesses/:id/bank-accounts', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, addBankAccountHandler);

  app.get('/businesses/:id/bank-accounts', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, getBankAccountsHandler);
}
