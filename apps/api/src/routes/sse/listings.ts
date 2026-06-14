import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';

export async function sseListingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/sse/listings', async (request: FastifyRequest<{ Querystring: { city?: string } }>, reply: FastifyReply) => {
    const city = request.query.city ?? 'lagos';

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Subscribe to Redis channel
    const subscriber = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379');
    const channel = `channel:listings:${city}`;

    await subscriber.subscribe(channel);

    subscriber.on('message', (_ch: string, message: string) => {
      reply.raw.write(`data: ${message}\n\n`);
    });

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      reply.raw.write(`:heartbeat\n\n`);
    }, 30000);

    // Cleanup on disconnect
    request.raw.on('close', () => {
      clearInterval(heartbeat);
      subscriber.unsubscribe(channel);
      subscriber.quit();
    });
  });
}
