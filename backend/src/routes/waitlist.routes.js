import { waitlistHandler }  from '../handlers/waitlist.handler.js';
import { authenticate }     from '../hooks/authenticate.js';
import { joinWaitlistBody } from '../schemas/booking.schema.js';

export async function waitlistRoutes(app) {
  app.post('/',           { preHandler: authenticate, schema: { body: joinWaitlistBody } }, waitlistHandler.join);
  app.delete('/:eventId', { preHandler: authenticate }, waitlistHandler.leave);
}
