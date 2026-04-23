import { bookingHandler }    from '../handlers/booking.handler.js';
import { authenticate }      from '../hooks/authenticate.js';
import { createBookingBody } from '../schemas/booking.schema.js';

export async function bookingRoutes(app) {
  app.post('/',    { preHandler: authenticate, schema: { body: createBookingBody } }, bookingHandler.create);
  app.delete('/:id', { preHandler: authenticate }, bookingHandler.cancel);
  app.get('/my',   { preHandler: authenticate }, bookingHandler.myBookings);
}
