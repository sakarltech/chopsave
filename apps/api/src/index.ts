import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { businessRoutes } from './routes/businesses';
import { adminRoutes } from './routes/admin';
import { listingRoutes } from './routes/listings';
import { reservationRoutes } from './routes/reservations';
import { paymentRoutes } from './routes/payments';
import { businessOrderRoutes } from './routes/business-orders';
import { notificationRoutes } from './routes/notifications';
import { ratingRoutes } from './routes/ratings';
import { payoutRoutes } from './routes/payouts';
import { sseListingRoutes } from './routes/sse/listings';

const app = Fastify({ logger: true });

// Plugins
app.register(cors, { origin: true });
app.register(helmet);
app.register(authPlugin);

// Routes
app.get('/health', async () => ({ status: 'ok', service: 'chopsave-api' }));
app.register(authRoutes);
app.register(userRoutes);
app.register(businessRoutes);
app.register(adminRoutes);
app.register(listingRoutes);
app.register(reservationRoutes);
app.register(paymentRoutes);
app.register(businessOrderRoutes);
app.register(notificationRoutes);
app.register(ratingRoutes);
app.register(payoutRoutes);
app.register(sseListingRoutes);

const start = async (): Promise<void> => {
  try {
    const port = Number(process.env['PORT'] ?? 3001);
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export default app;
