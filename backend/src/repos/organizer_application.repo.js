import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.OrganizerApplication);

const allowedFields = () => new Set(Object.keys(sequelize.models.OrganizerApplication.rawAttributes));

export const organizerApplicationRepo = {
  ...base,

  findMany(filter = {}, opts = {}) {
    const allowed = allowedFields();
    const where = Object.fromEntries(
      Object.entries(filter).filter(([k]) => allowed.has(k)),
    );
    return base.findAll(where, { order: [['submittedAt', 'DESC']], ...opts });
  },
};
