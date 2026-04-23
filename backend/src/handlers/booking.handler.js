import { bookingService } from '../services/booking.service.js';

const shapeBooking = ({ updatedAt, ...booking }) => booking;

export const bookingHandler = {
  async create(req, reply) {
    const result = await bookingService.create(req.body, req.user.id);
    reply.code(201).send({ booking: shapeBooking(result) });
  },

  async cancel(req, reply) {
    const booking = await bookingService.cancel(req.params.id, req.user.id);
    reply.send({ booking: shapeBooking(booking) });
  },

  async myBookings(req, reply) {
    const bookings = await bookingService.getMyBookings(req.user.id);
    reply.send({ bookings: bookings.map(shapeBooking) });
  },
};
