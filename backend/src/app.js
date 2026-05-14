import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './configs/index.js';
import { requestLogger } from './hooks/requestLogger.js';
import { authRoutes }                 from './routes/auth.routes.js';
import { eventRoutes }                from './routes/event.routes.js';
import { adminRoutes }                from './routes/admin.routes.js';
import { bookingRoutes }              from './routes/booking.routes.js';
import { waitlistRoutes }             from './routes/waitlist.routes.js';
import { organizerApplicationRoutes,
         adminOrganizerApplicationRoutes } from './routes/organizer_application.routes.js';
import { meRoutes } from './routes/me.routes.js';
import { AppError }       from './utils/errors.js';

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS_ROOT = resolve(BACKEND_ROOT, 'uploads');

export async function buildApp() {
  const app = Fastify({ logger: config.nodeEnv !== 'test' });

  await app.register(cors, { origin: config.appUrl, credentials: true });
  await app.register(jwt, { secret: config.jwtSecret });
  await app.register(multipart, { limits: { fileSize: 4 * 1024 * 1024, files: 1 } });
  await app.register(staticPlugin, {
    root:   UPLOADS_ROOT,
    prefix: '/uploads/',
  });

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
  await app.register(organizerApplicationRoutes,      { prefix: '/organizer-applications' });
  await app.register(adminOrganizerApplicationRoutes, { prefix: '/admin/organizer-applications' });
  await app.register(meRoutes,                        { prefix: '/me' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}

