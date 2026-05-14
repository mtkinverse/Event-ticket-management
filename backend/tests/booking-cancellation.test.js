import { buildApp }   from '../src/app.js';
import { initModels } from '../src/models/index.js';
import { sequelize }  from '../src/db/index.js';
import { userRepo }   from '../src/repos/user.repo.js';
import { eventRepo }  from '../src/repos/event.repo.js';
import { createUser } from '../src/strategies/factories/user.factory.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get } from './helpers/request.js';
import { seedOrganizer, seedAdmin } from './helpers/seed.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const del = (app, url, token) =>
  app.inject({ method: 'DELETE', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

// ── users ───────────────────────────────────────────────────────────────────
const orgToken   = await seedOrganizer(app, { name: 'Organizer', email: 'org@cx.com' });
const adminToken = await seedAdmin(app,     { name: 'Admin',     email: 'admin@cx.com' });
const custToken  = JSON.parse((await post(app, '/auth/register', { name: 'Customer', email: 'cust@cx.com', password: 'secret123' })).body).token;

// ── two approved events: A with future refundDeadline, B with past one ─────
const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString();
const futureDeadline = new Date(Date.now() + 3 * 86_400_000).toISOString();
const pastDeadline   = new Date(Date.now() -     86_400_000).toISOString();

const eventA = JSON.parse((await post(app, '/events', {
  title: 'Concert A', description: 'A', category: 'music', location: 'NYC',
  startsAt: tomorrow, endsAt: dayAfter, capacity: 5, ticketPriceMinor: 0, currency: 'PKR',
}, { authorization: `Bearer ${orgToken}` })).body).event;
await post(app, `/admin/events/${eventA.id}/approve`, {}, { authorization: `Bearer ${adminToken}` });
await eventRepo.updateById(eventA.id, { refundDeadline: futureDeadline });

const eventB = JSON.parse((await post(app, '/events', {
  title: 'Concert B', description: 'B', category: 'theatre', location: 'LA',
  startsAt: tomorrow, endsAt: dayAfter, capacity: 5, ticketPriceMinor: 0, currency: 'PKR',
}, { authorization: `Bearer ${orgToken}` })).body).event;
await post(app, `/admin/events/${eventB.id}/approve`, {}, { authorization: `Bearer ${adminToken}` });
await eventRepo.updateById(eventB.id, { refundDeadline: pastDeadline });

// ── customer books one of each ──────────────────────────────────────────────
const bookA = JSON.parse((await post(app, '/bookings', { eventId: eventA.id, quantity: 2 }, { authorization: `Bearer ${custToken}` })).body).booking;
const bookB = JSON.parse((await post(app, '/bookings', { eventId: eventB.id, quantity: 1 }, { authorization: `Bearer ${custToken}` })).body).booking;

// ── GET /bookings/my enriches each booking with its event summary ──────────
{
  const res = await get(app, '/bookings/my', custToken);
  assertStatus(res, 200, 'listMine → 200');
  const body = JSON.parse(res.body);
  assert(body.bookings.length === 2, 'returns 2 bookings');

  const byId = Object.fromEntries(body.bookings.map(b => [b.id, b]));
  const a = byId[bookA.id];
  const b = byId[bookB.id];

  assert(a.event && b.event, 'every booking carries an event summary');
  assert(a.event.title === 'Concert A',                 'a.event.title');
  assert(a.event.location === 'NYC',                    'a.event.location');
  assert(typeof a.event.startsAt === 'string',          'a.event.startsAt is string');
  assert(a.event.refundDeadline === futureDeadline,     'a.event.refundDeadline (future)');
  assert(a.event.status === 'active',                   'a.event.status');
  assert(b.event.refundDeadline === pastDeadline,       'b.event.refundDeadline (past)');
  assert(a.cancelledAt === null,                        'a.cancelledAt null pre-cancel');
}

// ── eventRepo.findMany returns rows for an array filter (bulk path) ────────
{
  const events = await eventRepo.findMany({ id: [eventA.id, eventB.id] });
  assert(events.length === 2,                                       'findMany({ id: [...] }) returns both rows in one query');
  assert(new Set(events.map(e => e.id)).size === 2,                 'returned ids are unique');
  assert(events.every(e => [eventA.id, eventB.id].includes(e.id)),  'returned ids match the filter');
}

// ── eventRepo.findMany silently drops unknown filter keys ───────────────────
{
  const events = await eventRepo.findMany({ id: [eventA.id], notARealColumn: 'boom' });
  assert(events.length === 1, 'unknown column filtered out, query still runs');
}

// ── cancel before deadline → 200, status flips, seats restored ─────────────
{
  const res = await del(app, `/bookings/${bookA.id}`, custToken);
  assertStatus(res, 200, 'cancel before deadline → 200');
  const body = JSON.parse(res.body);
  assert(body.booking.status === 'cancelled', 'booking → cancelled');
  assert(body.booking.cancelledAt,            'cancelledAt set');

  const ev = await eventRepo.findById(eventA.id);
  assert(ev.remaining === 5, 'eventA remaining restored to 5');
}

// ── cancel after deadline → 422, seats untouched ───────────────────────────
{
  const before = await eventRepo.findById(eventB.id);
  const res = await del(app, `/bookings/${bookB.id}`, custToken);
  assertStatus(res, 422, 'cancel after deadline → 422');
  const body = JSON.parse(res.body);
  assert(/Refund deadline/i.test(body.error), 'error mentions refund deadline');

  const after = await eventRepo.findById(eventB.id);
  assert(after.remaining === before.remaining, 'eventB remaining unchanged after rejected cancel');
}

// ── listMine after cancel still enriches the cancelled booking ─────────────
{
  const res = await get(app, '/bookings/my', custToken);
  const body = JSON.parse(res.body);
  const a = body.bookings.find(b => b.id === bookA.id);
  assert(a.status === 'cancelled',                'cancelled status reflected in listMine');
  assert(a.cancelledAt !== null,                  'cancelledAt populated in listMine');
  assert(a.event && a.event.title === 'Concert A', 'event enrichment present on cancelled row');
}

await app.close();
await sequelize.close();
summary();
