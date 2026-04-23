import { bookingRepo }        from '../repos/booking.repo.js';
import { ticketRepo }         from '../repos/ticket.repo.js';
import { eventRepo }          from '../repos/event.repo.js';
import { createBooking }      from '../strategies/factories/booking.factory.js';
import { createTickets }      from '../strategies/factories/ticket.factory.js';
import { canCancelBooking }   from '../strategies/policies/booking.policy.js';
import { waitlistService }    from './waitlist.service.js';
import { AppError }           from '../utils/errors.js';

export const bookingService = {
  async create({ eventId, quantity }, userId) {
    return bookingRepo.withTransaction(async (t) => {
      const event = await eventRepo.findById(eventId, { lock: 'UPDATE', transaction: t });
      if (!event) throw new AppError('Event not found', 404);
      if (event.status !== 'active') throw new AppError('Event is not active', 422);
      if (!event.registrationOpen) throw new AppError('Registration is closed', 422);
      if (event.remaining < quantity) throw new AppError('Not enough seats available', 409);

      await eventRepo.updateById(eventId, { remaining: event.remaining - quantity }, { transaction: t });

      const bookingData = createBooking({ userId, eventId, quantity, ticketPrice: event.ticketPrice });
      const booking = await bookingRepo.insert(bookingData, { transaction: t });

      const ticketRecords = await createTickets({ bookingId: booking.id, eventId, userId, quantity });
      const tickets = await ticketRepo.insertBulk(ticketRecords, { transaction: t });

      return { ...booking, tickets };
    });
  },

  async cancel(bookingId, userId) {
    return bookingRepo.withTransaction(async (t) => {
      const booking = await bookingRepo.findById(bookingId, { transaction: t });
      if (!booking) throw new AppError('Booking not found', 404);
      if (!canCancelBooking({ id: userId }, booking)) throw new AppError('Forbidden', 403);

      const event = await eventRepo.findById(booking.eventId, { lock: 'UPDATE', transaction: t });
      if (event.refundDeadline && new Date() > new Date(event.refundDeadline)) {
        throw new AppError('Refund deadline has passed', 422);
      }

      const bookingTickets = await ticketRepo.findByBooking(bookingId, { transaction: t });

      await bookingRepo.updateById(bookingId, { status: 'cancelled' }, { transaction: t });
      if (bookingTickets.length) {
        await ticketRepo.updateBulk(bookingTickets.map(tk => tk.id), { status: 'refunded' }, { transaction: t });
      }
      await eventRepo.updateById(booking.eventId, { remaining: event.remaining + booking.quantity }, { transaction: t });

      await waitlistService.promote(booking.eventId, t);

      return bookingRepo.findById(bookingId, { transaction: t });
    });
  },

  getMyBookings(userId) {
    return bookingRepo.findByUser(userId);
  },
};
