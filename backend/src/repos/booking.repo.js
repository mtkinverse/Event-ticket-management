import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.Booking);

export const bookingRepo = {
  ...base,

  findByUser(userId, opts = {}) {
    return base.findAll({ userId }, { order: [['placedAt', 'DESC']], ...opts });
  },
};
