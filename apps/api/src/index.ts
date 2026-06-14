import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth';

const app = Fastify({ logger: true });

// Plugins
app.register(cors, { origin: true });
app.register(helmet);
app.register(authPlugin);

// Routes
app.get('/health', async () => ({ status: 'ok', service: 'chopsave-api' }));
app.register(authRoutes);

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
