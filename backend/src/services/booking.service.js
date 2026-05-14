import { bookingRepo }         from '../repos/booking.repo.js';
import { ticketRepo }          from '../repos/ticket.repo.js';
import { eventRepo }           from '../repos/event.repo.js';
import { userRepo }            from '../repos/user.repo.js';
import { waitlistEntryRepo }   from '../repos/waitlist_entry.repo.js';
import { createBooking }       from '../strategies/factories/booking.factory.js';
import { createTickets }       from '../strategies/factories/ticket.factory.js';
import { canBook, canCancelBooking } from '../strategies/policies/booking.policy.js';
import { notificationService } from './notification.service.js';
import { waitlistService }     from './waitlist.service.js';
import { AppError }            from '../utils/errors.js';

const slimEvent = (e) => e && ({
  id:             e.id,
  title:          e.title,
  location:       e.location,
  startsAt:       e.startsAt,
  refundDeadline: e.refundDeadline,
  status:         e.status,
});

export const bookingService = {
  async create({ eventId, quantity }, user) {
    if (!canBook(user)) throw new AppError('Forbidden', 403);

    let lockedEvent;

    const result = await bookingRepo.withTransaction(async (t) => {
      const event = await eventRepo.findById(eventId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!event) throw new AppError('Event not found', 404);
      if (event.status !== 'active') throw new AppError('Event is not open for booking', 422);
      if (!event.registrationOpen) throw new AppError('Registration is closed', 422);
      if (event.remaining < quantity) throw new AppError('Not enough seats remaining', 409);
      lockedEvent = event;

      await eventRepo.updateById(eventId, { remaining: event.remaining - quantity }, { transaction: t });

      const bookingRow = createBooking({ userId: user.id, eventId, quantity, ticketPrice: event.ticketPrice });
      const saved = await bookingRepo.insert(bookingRow, { transaction: t });

      const tickets = await createTickets({ bookingId: saved.id, eventId, quantity });
      const savedTickets = await ticketRepo.insertBulk(tickets, { transaction: t });

      // Auto-clear waitlist: if this user was waitlisted for this event, drop the entry
      // so they aren't holding a redundant spot now that they've booked.
      const existingWl = await waitlistEntryRepo.findByUserAndEvent(user.id, eventId, { transaction: t });
      if (existingWl) await waitlistEntryRepo.deleteById(existingWl.id, { transaction: t });

      // TODO Phase 4: chargeBooking(saved) via payment strategy

      return { ...saved, tickets: savedTickets };
    });

    await notificationService.notify({
      user,
      type: 'booking.confirmed',
      payload: { booking: result, event: slimEvent(lockedEvent), tickets: result.tickets },
    });

    return result;
  },

  async cancel(bookingId, user) {
    let lockedEvent;

    const saved = await bookingRepo.withTransaction(async (t) => {
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
        lockedEvent = event;
      }

      const cancelledAt = new Date();
      await bookingRepo.updateById(
        bookingId,
        { status: 'cancelled', cancelledAt },
        { transaction: t },
      );
      const tickets = await ticketRepo.findByBooking(bookingId, { transaction: t });

      // TODO Phase 4: refundBooking(saved)

      return { ...booking, status: 'cancelled', cancelledAt, tickets };
    });

    // Email the booking owner (which may not be the actor — admin can cancel customer bookings).
    const owner = user.id === saved.userId ? user : await userRepo.findById(saved.userId);
    await notificationService.notify({
      user: owner,
      type: 'booking.cancelled',
      payload: { booking: saved, event: slimEvent(lockedEvent) },
    });

    // Promote the next waiting waitlist entry (advisory hold). Phase 4 will harden seat reservation.
    const promoted = await waitlistService.promote(saved.eventId);
    if (promoted) {
      const promotedUser = await userRepo.findById(promoted.entry.userId);
      await notificationService.notify({
        user: promotedUser,
        type: 'waitlist.promoted',
        payload: { event: slimEvent(lockedEvent), holdExpiresAt: promoted.holdExpiresAt },
      });
    }

    return saved;
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

    return bookings.map(b => ({
      ...b,
      tickets: byBooking[b.id] ?? [],
      event:   slimEvent(byEvent[b.eventId]),
    }));
  },
};
