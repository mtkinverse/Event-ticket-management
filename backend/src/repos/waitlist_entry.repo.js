import { Op } from 'sequelize';
import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.WaitlistEntry);

export const waitlistEntryRepo = {
  ...base,

  findByEvent(eventId, opts = {}) {
    return base.findAll({ eventId }, opts);
  },

  findByUserAndEvent(userId, eventId, opts = {}) {
    return base.findOne({ userId, eventId }, opts);
  },

  findNextQueued(eventId, opts = {}) {
    return base.findOne({ eventId, status: 'queued' }, { order: [['position', 'ASC']], ...opts });
  },

  findHeldExpired(eventId) {
    return base.findAll({
      eventId,
      status: 'held',
      holdExpiresAt: { [Op.lt]: new Date() },
    });
  },
};
