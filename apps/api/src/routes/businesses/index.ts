import { FastifyInstance } from 'fastify';
import { registerBusinessHandler } from './register';
import { getBusinessHandler, updateBusinessHandler } from './profile';
import { addBankAccountHandler, getBankAccountsHandler } from './bankAccounts';
import { requireRole } from '../../middleware/requireRole';
import type { RegisterBusinessBody } from './register';
import type { UpdateBusinessBody } from './profile';
import type { AddBankAccountBody } from './bankAccounts';

export async function businessRoutes(app: FastifyInstance): Promise<void> {
  // Public
  app.get<{ Params: { id: string } }>('/businesses/:id', getBusinessHandler);

  // Authenticated - any role (will upgrade to business_owner)
  app.post<{ Body: RegisterBusinessBody }>('/businesses/register', {
    preHandler: [app.authenticate],
  }, registerBusinessHandler);

  // Business owner only
  app.patch<{ Params: { id: string }; Body: UpdateBusinessBody }>('/businesses/:id', {
    preHandler: [app.authenticate, requireRole('business_owner', 'admin')],
  }, updateBusinessHandler);

  // Bank accounts (business owner only)
  app.post<{ Params: { id: string }; Body: AddBankAccountBody }>('/businesses/:id/bank-accounts', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, addBankAccountHandler);

  app.get('/businesses/:id/bank-accounts', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, getBankAccountsHandler);
}
