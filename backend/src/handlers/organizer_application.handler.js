import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { organizerApplicationService } from '../services/organizer_application.service.js';
import { AppError } from '../utils/errors.js';

// Compute uploads root locally (avoids a circular import via app.js).
const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const UPLOAD_DIR   = resolve(BACKEND_ROOT, 'uploads', 'snapshots');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIMETYPES = /^image\/(png|jpe?g|webp)$/;

const shape = ({ updatedAt, createdAt, ...a }) => a;

const fieldValue = (fields, name) => fields[name]?.value ?? null;

export const organizerApplicationHandler = {
  async submit(req, reply) {
    const data = await req.file();
    if (!data) throw new AppError('Payment snapshot is required', 422);
    if (!ALLOWED_MIMETYPES.test(data.mimetype)) {
      throw new AppError('Unsupported image type — use PNG, JPEG, or WebP', 422);
    }

    const ext = data.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const id  = uuidv4();
    const rel = `/uploads/snapshots/${id}.${ext}`;
    const abs = resolve(UPLOAD_DIR, `${id}.${ext}`);

    await pipeline(data.file, createWriteStream(abs));

    const f = data.fields;
    const saved = await organizerApplicationService.submit({
      paymentSnapshotPath: rel,
      businessName:        fieldValue(f, 'businessName'),
      motivation:          fieldValue(f, 'motivation'),
      paymentAmountMinor:  Number(fieldValue(f, 'paymentAmountMinor')),
      currency:            fieldValue(f, 'currency') ?? 'PKR',
      paymentReference:    fieldValue(f, 'paymentReference'),
    }, req.user);

    reply.code(201).send({ application: shape(saved) });
  },

  async mine(req, reply) {
    const app = await organizerApplicationService.getMine(req.user.id);
    reply.send({ application: app ? shape(app) : null });
  },

  async listPending(req, reply) {
    const apps = await organizerApplicationService.listPending(req.user);
    reply.send({ applications: apps.map(shape) });
  },

  async approve(req, reply) {
    const app = await organizerApplicationService.approve(req.params.id, req.user);
    reply.send({ application: shape(app) });
  },

  async reject(req, reply) {
    const app = await organizerApplicationService.reject(req.params.id, req.body.reason, req.user);
    reply.send({ application: shape(app) });
  },
};
