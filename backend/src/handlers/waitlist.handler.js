import { waitlistService } from '../services/waitlist.service.js';

export const waitlistHandler = {
  async join(req, reply) {
    const entry = await waitlistService.join({ userId: req.user.id, eventId: req.body.eventId });
    reply.code(201).send({ entry });
  },

  async leave(req, reply) {
    await waitlistService.leave(req.user.id, req.params.eventId);
    reply.code(204).send();
  },
};
