import { adminHandler }   from '../handlers/admin.handler.js';
import { authenticate }   from '../hooks/authenticate.js';
import { authorize }      from '../hooks/authorize.js';
import { canApproveEvent } from '../strategies/policies/event.policy.js';
import { rejectBody }     from '../schemas/event.schema.js';

const adminAuth = [authenticate, authorize(canApproveEvent)];

export async function adminRoutes(app) {
  app.get('/events',             { preHandler: adminAuth }, adminHandler.listPending);
  app.post('/events/:id/approve', { preHandler: adminAuth }, adminHandler.approve);
  app.post('/events/:id/reject',  { preHandler: adminAuth, schema: { body: rejectBody } }, adminHandler.reject);
}
