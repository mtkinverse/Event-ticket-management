import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.ApplicationFee);

export const applicationFeeRepo = {
  ...base,

  findByEvent(eventId, opts = {}) {
    return base.findOne({ eventId }, opts);
  },
};
