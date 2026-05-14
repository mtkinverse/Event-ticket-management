import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.WaitlistEntry);

const allowedFields = () => new Set(Object.keys(sequelize.models.WaitlistEntry.rawAttributes));

export const waitlistEntryRepo = {
  ...base,

  findMany(filter = {}, opts = {}) {
    const allowed = allowedFields();
    const where = Object.fromEntries(
      Object.entries(filter).filter(([k]) => allowed.has(k)),
    );
    return base.findAll(where, opts);
  },

  findByUserAndEvent(userId, eventId, opts = {}) {
    return base.findOne({ userId, eventId }, opts);
  },

  findFirstWaiting(eventId, opts = {}) {
    return base.findOne({ eventId, status: 'waiting' }, { order: [['joinedAt', 'ASC']], ...opts });
  },
};
