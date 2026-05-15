import { Op } from 'sequelize';
import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.Event);

const allowedFields = () => new Set(Object.keys(sequelize.models.Event.rawAttributes));

export const eventRepo = {
  ...base,

  findMany(filter = {}, opts = {}) {
    const allowed = allowedFields();
    const where = Object.fromEntries(
      Object.entries(filter).filter(([k]) => allowed.has(k)),
    );
    return base.findAll(where, opts);
  },

  findActive(filters = {}) {
    const where = { status: 'active' };
    if (filters.category) where.category = filters.category;
    if (filters.location) where.location = { [Op.iLike]: `%${filters.location}%` };
    if (filters.search) {
      where[Op.or] = [
        { title:       { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }
    return base.findAll(where);
  },

  findTop(limit = 6) {
    return base.findAll({ status: 'active' }, { order: [['startsAt', 'DESC']], limit });
  },

  findByOrganizer(organizerId, opts = {}) {
    return base.findAll({ organizerId }, opts);
  },

  findPending(opts = {}) {
    return base.findAll({ status: 'pending' }, opts);
  },

  findRelated(eventId, category, limit = 4) {
    return base.findAll(
      { status: 'active', category, id: { [Op.ne]: eventId } },
      { limit },
    );
  },
};
