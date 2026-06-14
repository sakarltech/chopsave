import { FastifyInstance } from 'fastify';
import { submitRatingHandler, getBusinessRatingsHandler } from './ratings';

export async function ratingRoutes(app: FastifyInstance): Promise<void> {
  app.post('/ratings', { preHandler: [app.authenticate] }, submitRatingHandler);
  app.get('/businesses/:id/ratings', getBusinessRatingsHandler);
}
