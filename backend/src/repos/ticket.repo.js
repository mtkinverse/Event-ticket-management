import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.Ticket);

export const ticketRepo = {
  ...base,

  findByBooking(bookingId, opts = {}) {
    return base.findAll({ bookingId }, opts);
  },
};
