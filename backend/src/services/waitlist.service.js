import { waitlistEntryRepo }   from '../repos/waitlist_entry.repo.js';
import { eventRepo }            from '../repos/event.repo.js';
import { createWaitlistEntry }  from '../strategies/factories/waitlist.factory.js';
import { canJoinWaitlist }      from '../strategies/policies/waitlist.policy.js';
import { notificationService }  from './notification.service.js';
import { config }               from '../configs/index.js';
import { AppError }             from '../utils/errors.js';

const slimEvent = (e) => e && ({
  id:             e.id,
  title:          e.title,
  location:       e.location,
  startsAt:       e.startsAt,
  refundDeadline: e.refundDeadline,
  status:         e.status,
});

export const waitlistService = {
  async join({ eventId }, user) {
    if (!canJoinWaitlist(user)) throw new AppError('Forbidden', 403);

    const event = await eventRepo.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    if (event.status !== 'active') throw new AppError('Event is not open', 422);
    if (event.remaining > 0) throw new AppError('Seats are still available — book directly instead', 422);

    const existing = await waitlistEntryRepo.findByUserAndEvent(user.id, eventId);
    if (existing && existing.status !== 'expired') {
      throw new AppError('Already on waitlist for this event', 409);
    }

    const row = createWaitlistEntry({ userId: user.id, eventId });
    const saved = await waitlistEntryRepo.insert(row);

    await notificationService.notify({
      user,
      type: 'waitlist.joined',
      payload: { event: slimEvent(event) },
    });

    return saved;
  },

  async leave(eventId, user) {
    const existing = await waitlistEntryRepo.findByUserAndEvent(user.id, eventId);
    if (!existing) throw new AppError('Not on waitlist', 404);
    await waitlistEntryRepo.deleteById(existing.id);
    return { id: existing.id };
  },

  /**
   * Promote the first waiting entry on an event to `held` status with a hold deadline.
   * Called by bookingService.cancel after the seat is restored.
   * Returns { entry, holdExpiresAt } or null if nobody is waiting.
   */
  async promote(eventId) {
    const next = await waitlistEntryRepo.findFirstWaiting(eventId);
    if (!next) return null;

    const holdExpiresAt = new Date(Date.now() + config.waitlistHoldMinutes * 60_000);
    const updated = await waitlistEntryRepo.updateById(next.id, {
      status:        'held',
      holdExpiresAt,
    });

    return { entry: updated, holdExpiresAt };
  },

  async listMine(userId) {
    const entries = await waitlistEntryRepo.findMany({ userId });
    if (entries.length === 0) return [];

    const eventIds = [...new Set(entries.map(e => e.eventId))];
    const events   = await eventRepo.findMany({ id: eventIds });
    const byEvent  = Object.fromEntries(events.map(e => [e.id, e]));

    return entries.map(e => ({
      ...e,
      event: slimEvent(byEvent[e.eventId]),
    }));
  },
};
