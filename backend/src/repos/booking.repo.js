import { sequelize } from '../db/index.js';
import { createBaseRepo } from './base.repo.js';

const base = createBaseRepo(() => sequelize.models.Booking);

export const bookingRepo = {
  ...base,

  findByUser(userId, opts = {}) {
    const Ticket = sequelize.models.Ticket;
    return base.findAll({ userId }, {
      include: [{ model: Ticket, as: 'tickets' }],
      order: [['placedAt', 'DESC']],
      ...opts,
    });
  },

  findByUserAndEvent(userId, eventId, opts = {}) {
    return base.findOne({ userId, eventId }, opts);
  },
};
