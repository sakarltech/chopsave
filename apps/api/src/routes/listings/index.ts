import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { createListingHandler } from './create';
import { getNearbyListingsHandler, getListingDetailHandler } from './nearby';
import { updateListingHandler, updateListingStatusHandler, deleteListingHandler } from './manage';
import { addListingItemHandler, updateListingItemHandler, deleteListingItemHandler } from './items';
import type { CreateListingBody } from './create';
import type { UpdateListingBody, StatusBody } from './manage';
import type { AddItemBody } from './items';

export async function listingRoutes(app: FastifyInstance): Promise<void> {
  // Public
  app.get('/listings/nearby', getNearbyListingsHandler);
  app.get('/listings/:id', getListingDetailHandler);

  // Business owner
  app.post<{ Body: CreateListingBody }>('/listings', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, createListingHandler);

  app.patch<{ Params: { id: string }; Body: UpdateListingBody }>('/listings/:id', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, updateListingHandler);

  app.patch<{ Params: { id: string }; Body: StatusBody }>('/listings/:id/status', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, updateListingStatusHandler);

  app.delete<{ Params: { id: string } }>('/listings/:id', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, deleteListingHandler);

  // Listing items (itemised listings)
  app.post<{ Params: { id: string }; Body: AddItemBody }>('/listings/:id/items', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, addListingItemHandler);

  app.patch<{ Params: { id: string; itemId: string }; Body: Partial<AddItemBody> }>('/listings/:id/items/:itemId', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, updateListingItemHandler);

  app.delete<{ Params: { id: string; itemId: string } }>('/listings/:id/items/:itemId', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, deleteListingItemHandler);
}
