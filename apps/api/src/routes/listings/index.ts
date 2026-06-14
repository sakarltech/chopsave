import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/requireRole';
import { createListingHandler } from './create';
import { getNearbyListingsHandler, getListingDetailHandler } from './nearby';
import { updateListingHandler, updateListingStatusHandler, deleteListingHandler } from './manage';
import { addListingItemHandler, updateListingItemHandler, deleteListingItemHandler } from './items';

export async function listingRoutes(app: FastifyInstance): Promise<void> {
  // Public
  app.get('/listings/nearby', getNearbyListingsHandler);
  app.get('/listings/:id', getListingDetailHandler);

  // Business owner
  app.post('/listings', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, createListingHandler);

  app.patch('/listings/:id', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, updateListingHandler);

  app.patch('/listings/:id/status', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, updateListingStatusHandler);

  app.delete('/listings/:id', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, deleteListingHandler);

  // Listing items (itemised listings)
  app.post('/listings/:id/items', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, addListingItemHandler);

  app.patch('/listings/:id/items/:itemId', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, updateListingItemHandler);

  app.delete('/listings/:id/items/:itemId', {
    preHandler: [app.authenticate, requireRole('business_owner')],
  }, deleteListingItemHandler);
}
