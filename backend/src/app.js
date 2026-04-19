import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './configs/index.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: config.appUrl, credentials: true });
  await app.register(jwt, { secret: config.jwtSecret });

  // hooks/, routes/ are registered here in later phases.
  // Example:
  //   app.addHook('onRequest', authenticate);
  //   await app.register(eventRoutes, { prefix: '/events' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
