import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.NotificationPreference);

export const notificationPreferenceRepo = {
  ...base,

  findOneByUserAndType(userId, type) {
    return base.findOne({ userId, type });
  },

  async isMuted(userId, type) {
    const row = await base.findOne({ userId, type });
    return !!(row && row.muted);
  },

  findByUser(userId) {
    return base.findAll({ userId });
  },
};
