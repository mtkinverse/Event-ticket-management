import { waitlistService } from '../services/waitlist.service.js';

const shapeEntry = ({ updatedAt, createdAt, ...e }) => e;

export const waitlistHandler = {
  async join(req, reply) {
    const entry = await waitlistService.join(req.body, req.user);
    reply.code(201).send({ entry: shapeEntry(entry) });
  },

  async leave(req, reply) {
    const result = await waitlistService.leave(req.params.eventId, req.user);
    reply.send(result);
  },

  async mine(req, reply) {
    const entries = await waitlistService.listMine(req.user.id);
    reply.send({ entries: entries.map(shapeEntry) });
  },
};
