import { waitlistEntryRepo } from '../repos/waitlist_entry.repo.js';
import { eventRepo }         from '../repos/event.repo.js';
import { config }            from '../configs/index.js';
import { AppError }          from '../utils/errors.js';
import { v4 as uuidv4 }      from 'uuid';

export const waitlistService = {
  async join({ userId, eventId }) {
    const event = await eventRepo.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    if (event.status !== 'active') throw new AppError('Event is not active', 422);
    if (event.remaining > 0) throw new AppError('Event still has seats available', 422);

    await waitlistService.expireHeld(eventId);

    const existing = await waitlistEntryRepo.findByUserAndEvent(userId, eventId);
    if (existing && ['queued', 'held'].includes(existing.status)) {
      throw new AppError('Already on waitlist', 409);
    }

    const all = await waitlistEntryRepo.findByEvent(eventId);
    const position = all.length + 1;

    return waitlistEntryRepo.insert({
      id:       uuidv4(),
      userId,
      eventId,
      position,
      status:   'queued',
      holdExpiresAt: null,
      notifiedAt:    null,
    });
  },

  async leave(userId, eventId) {
    const entry = await waitlistEntryRepo.findByUserAndEvent(userId, eventId);
    if (!entry) throw new AppError('Not on waitlist', 404);
    if (!['queued', 'held'].includes(entry.status)) throw new AppError('Cannot leave waitlist', 422);
    return waitlistEntryRepo.deleteById(entry.id);
  },

  async promote(eventId, transaction) {
    const opts = transaction ? { transaction } : {};
    const next = await waitlistEntryRepo.findNextQueued(eventId, opts);
    if (!next) return;

    const holdExpiresAt = new Date(Date.now() + config.waitlistHoldMinutes * 60 * 1000);
    await waitlistEntryRepo.updateById(next.id, {
      status: 'held',
      holdExpiresAt,
      notifiedAt: new Date(),
    }, opts);
  },

  async expireHeld(eventId) {
    const expired = await waitlistEntryRepo.findHeldExpired(eventId);
    if (!expired.length) return;

    await waitlistEntryRepo.updateBulk(expired.map(e => e.id), { status: 'expired' });

    for (let i = 0; i < expired.length; i++) {
      await waitlistService.promote(eventId);
    }
  },
};
