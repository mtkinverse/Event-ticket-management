import { eventService } from '../services/event.service.js';

const shapeEvent = ({ updatedAt, ...event }) => event;

export const adminHandler = {
  async listPending(req, reply) {
    const events = await eventService.getPending();
    reply.send({ events: events.map(shapeEvent) });
  },

  async approve(req, reply) {
    const event = await eventService.approve(req.params.id);
    reply.send({ event: shapeEvent(event) });
  },

  async reject(req, reply) {
    const event = await eventService.reject(req.params.id, req.body.reason);
    reply.send({ event: shapeEvent(event) });
  },
};
