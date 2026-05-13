import { bookingRepo }   from '../repos/booking.repo.js';
import { ticketRepo }    from '../repos/ticket.repo.js';
import { eventRepo }     from '../repos/event.repo.js';
import { createBooking } from '../strategies/factories/booking.factory.js';
import { createTickets } from '../strategies/factories/ticket.factory.js';
import { canBook, canCancelBooking } from '../strategies/policies/booking.policy.js';
import { AppError }      from '../utils/errors.js';

export const bookingService = {
  async create({ eventId, quantity }, user) {
    if (!canBook(user)) throw new AppError('Forbidden', 403);

    return bookingRepo.withTransaction(async (t) => {
      const event = await eventRepo.findById(eventId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!event) throw new AppError('Event not found', 404);
      if (event.status !== 'active') throw new AppError('Event is not open for booking', 422);
      if (!event.registrationOpen) throw new AppError('Registration is closed', 422);
      if (event.remaining < quantity) throw new AppError('Not enough seats remaining', 409);

      await eventRepo.updateById(eventId, { remaining: event.remaining - quantity }, { transaction: t });

      const bookingRow = createBooking({ userId: user.id, eventId, quantity, ticketPrice: event.ticketPrice });
      const saved = await bookingRepo.insert(bookingRow, { transaction: t });

      const tickets = await createTickets({ bookingId: saved.id, eventId, quantity });
      const savedTickets = await ticketRepo.insertBulk(tickets, { transaction: t });

      // TODO Phase 4: chargeBooking(saved) via payment strategy
      // TODO Phase 5: notify user (email + QR attachment)

      return { ...saved, tickets: savedTickets };
    });
  },

  async cancel(bookingId, user) {
    return bookingRepo.withTransaction(async (t) => {
      const booking = await bookingRepo.findById(bookingId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!booking) throw new AppError('Booking not found', 404);
      if (!canCancelBooking(user, booking)) throw new AppError('Forbidden', 403);
      if (booking.status === 'cancelled') throw new AppError('Booking already cancelled', 422);

      const event = await eventRepo.findById(booking.eventId, { transaction: t, lock: t.LOCK.UPDATE });
      if (event?.refundDeadline && new Date() > new Date(event.refundDeadline)) {
        throw new AppError('Refund deadline has passed', 422);
      }
      if (event) {
        await eventRepo.updateById(event.id, { remaining: event.remaining + booking.quantity }, { transaction: t });
      }

      const cancelledAt = new Date();
      await bookingRepo.updateById(
        bookingId,
        { status: 'cancelled', cancelledAt },
        { transaction: t },
      );
      const saved = { ...booking, status: 'cancelled', cancelledAt };

      const tickets = await ticketRepo.findByBooking(bookingId, { transaction: t });

      // TODO Phase 4: refundBooking(saved)
      // TODO Phase 5: notify user of cancellation

      return { ...saved, tickets };
    });
  },

  async listMine(userId) {
    const bookings = await bookingRepo.findByUser(userId);
    if (bookings.length === 0) return [];

    const eventIds = [...new Set(bookings.map(b => b.eventId))];
    const events   = await eventRepo.findMany({ id: eventIds });
    const byEvent  = Object.fromEntries(events.map(e => [e.id, e]));

    const tickets = await ticketRepo.findByBookings(bookings.map(b => b.id));
    const byBooking = tickets.reduce((acc, t) => {
      (acc[t.bookingId] ||= []).push(t);
      return acc;
    }, {});

    return bookings.map(b => {
      const e = byEvent[b.eventId];
      return {
        ...b,
        tickets: byBooking[b.id] ?? [],
        event: e && {
          id:             e.id,
          title:          e.title,
          location:       e.location,
          startsAt:       e.startsAt,
          refundDeadline: e.refundDeadline,
          status:         e.status,
        },
      };
    });
  },
};
