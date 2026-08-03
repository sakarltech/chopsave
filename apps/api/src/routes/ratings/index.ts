import { FastifyInstance } from 'fastify';
import { submitRatingHandler, getBusinessRatingsHandler } from './ratings';
import type { SubmitRatingBody } from './ratings';

export async function ratingRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: SubmitRatingBody }>('/ratings', { preHandler: [app.authenticate] }, submitRatingHandler);
  app.get('/businesses/:id/ratings', getBusinessRatingsHandler);
}
