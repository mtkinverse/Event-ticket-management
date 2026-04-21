import { createBaseRepo } from './base.repo.js';
import { sequelize } from '../db/index.js';

const base = createBaseRepo(() => sequelize.models.User);

export const userRepo = {
  ...base,
  findByEmail: (email, opts = {}) => base.findOne({ email }, opts),
};
