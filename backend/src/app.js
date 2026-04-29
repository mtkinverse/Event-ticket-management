import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './configs/index.js';
import { requestLogger } from './hooks/requestLogger.js';
import { authRoutes }     from './routes/auth.routes.js';
import { eventRoutes }    from './routes/event.routes.js';
import { adminRoutes }    from './routes/admin.routes.js';
import { bookingRoutes }  from './routes/booking.routes.js';
import { waitlistRoutes } from './routes/waitlist.routes.js';
import { AppError }       from './utils/errors.js';

export async function buildApp() {
  const app = Fastify({ logger: config.nodeEnv !== 'test' });

  await app.register(cors, { origin: config.appUrl, credentials: true });
  await app.register(jwt, { secret: config.jwtSecret });

  app.addHook('onRequest', requestLogger);

  app.setErrorHandler((err, _req, reply) => {
    const status = err instanceof AppError ? err.statusCode : (err.statusCode ?? 500);
    const message = err instanceof AppError ? err.message : (status < 500 ? err.message : 'Internal Server Error');
    reply.code(status).send({ error: message });
  });

  await app.register(authRoutes,     { prefix: '/auth' });
  await app.register(eventRoutes,    { prefix: '/events' });
  await app.register(adminRoutes,    { prefix: '/admin' });
  await app.register(bookingRoutes,  { prefix: '/bookings' });
  await app.register(waitlistRoutes, { prefix: '/waitlist' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
