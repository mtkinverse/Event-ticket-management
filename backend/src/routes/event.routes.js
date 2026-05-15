import { eventHandler }  from '../handlers/event.handler.js';
import { authenticate }  from '../hooks/authenticate.js';
import { authorize }     from '../hooks/authorize.js';
import { canCreateEvent } from '../strategies/policies/event.policy.js';
import { updateEventBody, eventQueryParams } from '../schemas/event.schema.js';

export async function eventRoutes(app) {
  // Public
  app.get('/',    { schema: { querystring: eventQueryParams } }, eventHandler.list);
  app.get('/top', eventHandler.top);
  app.get('/:id', eventHandler.get);
  app.get('/:id/related', eventHandler.related);

  // Organizer — accepts JSON or multipart/form-data (when an image file is attached).
  app.post('/', { preHandler: [authenticate, authorize(canCreateEvent)] }, eventHandler.create);
  app.get('/mine', { preHandler: authenticate }, eventHandler.organizerEvents);
  app.patch('/:id', { preHandler: authenticate, schema: { body: updateEventBody } }, eventHandler.update);
}
