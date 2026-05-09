import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.WaitlistEntry);

export const waitlistEntryRepo = {
  ...base,

  findByUserAndEvent(userId, eventId, opts = {}) {
    return base.findOne({ userId, eventId }, opts);
  },

  findFirstWaiting(eventId, opts = {}) {
    return base.findOne({ eventId, status: 'waiting' }, { order: [['joinedAt', 'ASC']], ...opts });
  },
};
