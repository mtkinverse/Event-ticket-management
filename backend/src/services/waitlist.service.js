import { waitlistEntryRepo }  from '../repos/waitlist_entry.repo.js';
import { eventRepo }           from '../repos/event.repo.js';
import { createWaitlistEntry } from '../strategies/factories/waitlist.factory.js';
import { canJoinWaitlist }     from '../strategies/policies/waitlist.policy.js';
import { AppError }            from '../utils/errors.js';

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

    // TODO Phase 4: when seats free up, promote the first waiting entry to 'held' with holdExpiresAt
    // TODO Phase 5: notify user that they've been added to the waitlist

    return saved;
  },

  async leave(eventId, user) {
    const existing = await waitlistEntryRepo.findByUserAndEvent(user.id, eventId);
    if (!existing) throw new AppError('Not on waitlist', 404);
    await waitlistEntryRepo.deleteById(existing.id);
    return { id: existing.id };
  },
};
