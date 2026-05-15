import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { eventService } from '../services/event.service.js';
import { AppError } from '../utils/errors.js';

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const UPLOAD_DIR   = resolve(BACKEND_ROOT, 'uploads', 'events');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIMETYPES = /^image\/(png|jpe?g|webp)$/;

const num = (v, fallback = undefined) => (v === undefined || v === '' ? fallback : Number(v));

const REQUIRED_CREATE_FIELDS = ['title', 'description', 'category', 'location', 'startsAt', 'endsAt', 'capacity'];

const shapeEvent = ({ updatedAt, ...event }) => event;

async function parseMultipart(req) {
  const fields = {};
  let savedRel = null;
  for await (const part of req.parts()) {
    if (part.type === 'file') {
      if (!ALLOWED_MIMETYPES.test(part.mimetype)) {
        throw new AppError('Unsupported image type — use PNG, JPEG, or WebP', 422);
      }
      const ext = part.mimetype.split('/')[1].replace('jpeg', 'jpg');
      const id  = uuidv4();
      const rel = `/uploads/events/${id}.${ext}`;
      const abs = resolve(UPLOAD_DIR, `${id}.${ext}`);
      await pipeline(part.file, createWriteStream(abs));
      savedRel = rel;
    } else {
      fields[part.fieldname] = part.value;
    }
  }
  return {
    title:       fields.title,
    description: fields.description,
    category:    fields.category,
    location:    fields.location,
    startsAt:    fields.startsAt,
    endsAt:      fields.endsAt,
    capacity:    num(fields.capacity),
    ticketPriceMinor: num(fields.ticketPriceMinor, 0),
    currency:    fields.currency,
    ...(fields.meetingUrl     ? { meetingUrl:     fields.meetingUrl     } : {}),
    ...(savedRel              ? { imageUrl:       savedRel              } : {}),
    ...(fields.refundDeadline ? { refundDeadline: fields.refundDeadline } : {}),
  };
}

export const eventHandler = {
  async create(req, reply) {
    const body = req.isMultipart() ? await parseMultipart(req) : (req.body ?? {});
    const missing = REQUIRED_CREATE_FIELDS.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
    if (missing.length > 0) throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
    const event = await eventService.create(body, req.user.id);
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
