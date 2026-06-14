import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { businessRoutes } from './routes/businesses';
import { adminRoutes } from './routes/admin';

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
