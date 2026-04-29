import { bookingService } from '../services/booking.service.js';

const shapeTicket = ({ updatedAt, createdAt, ...t }) => t;

const shapeBooking = ({ updatedAt, createdAt, tickets = [], ...b }) => ({
  ...b,
  tickets: tickets.map(shapeTicket),
});

export const bookingHandler = {
  async create(req, reply) {
    const booking = await bookingService.create(req.body, req.user);
    reply.code(201).send({ booking: shapeBooking(booking) });
  },

  async cancel(req, reply) {
    const booking = await bookingService.cancel(req.params.id, req.user);
    reply.send({ booking: shapeBooking(booking) });
  },

  async mine(req, reply) {
    const bookings = await bookingService.listMine(req.user.id);
    reply.send({ bookings: bookings.map(shapeBooking) });
  },
};
