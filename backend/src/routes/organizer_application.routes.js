import { organizerApplicationHandler } from '../handlers/organizer_application.handler.js';
import { authenticate } from '../hooks/authenticate.js';
import { rejectApplicationBody } from '../schemas/organizer_application.schema.js';

export async function organizerApplicationRoutes(app) {
  app.post('/',     { preHandler: authenticate }, organizerApplicationHandler.submit);
  app.get('/mine',  { preHandler: authenticate }, organizerApplicationHandler.mine);
}

export async function adminOrganizerApplicationRoutes(app) {
  app.get('/',              { preHandler: authenticate }, organizerApplicationHandler.listPending);
  app.post('/:id/approve',  { preHandler: authenticate }, organizerApplicationHandler.approve);
  app.post('/:id/reject',   { preHandler: authenticate, schema: { body: rejectApplicationBody } }, organizerApplicationHandler.reject);
}
