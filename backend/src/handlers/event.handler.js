import { eventService } from '../services/event.service.js';

const shapeEvent = ({ updatedAt, ...event }) => event;

export const eventHandler = {
  async create(req, reply) {
    const event = await eventService.create(req.body, req.user.id);
    reply.code(201).send({ event: shapeEvent(event) });
  },

  async list(req, reply) {
    const events = await eventService.getAll(req.query);
    reply.send({ events: events.map(shapeEvent) });
  },

  async top(req, reply) {
    const events = await eventService.getTop();
    reply.send({ events: events.map(shapeEvent) });
  },

  async get(req, reply) {
    const event = await eventService.getOne(req.params.id);
    reply.send({ event: shapeEvent(event) });
  },

  async related(req, reply) {
    const events = await eventService.getRelated(req.params.id);
    reply.send({ events: events.map(shapeEvent) });
  },

  async organizerEvents(req, reply) {
    const events = await eventService.getOrganizerEvents(req.user.id);
    reply.send({ events: events.map(shapeEvent) });
  },

  async update(req, reply) {
    const event = await eventService.update(req.params.id, req.body, req.user);
    reply.send({ event: shapeEvent(event) });
  },
};
