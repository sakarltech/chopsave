import type { IncomingMessage, ServerResponse } from 'node:http';
import app from './index';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await app.ready();
  app.server.emit('request', req, res);
}
