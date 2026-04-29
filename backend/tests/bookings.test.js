import { buildApp }    from '../src/app.js';
import { initModels }  from '../src/models/index.js';
import { sequelize }   from '../src/db/index.js';
import { userRepo }    from '../src/repos/user.repo.js';
import { eventRepo }   from '../src/repos/event.repo.js';
import { createUser } from '../src/strategies/factories/user.factory.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get } from './helpers/request.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const del = (app, url, token) =>
  app.inject({ method: 'DELETE', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

// ── users ────────────────────────────────────────────────────────────────────
const orgRes  = await post(app, '/auth/register', { name: 'Organizer', email: 'org@bk.com',  password: 'secret123', role: 'organizer' });
const custRes = await post(app, '/auth/register', { name: 'Customer',  email: 'cust@bk.com', password: 'secret123', role: 'customer' });
const cust2Res = await post(app, '/auth/register', { name: 'Cust2',    email: 'cust2@bk.com', password: 'secret123', role: 'customer' });
const orgToken  = JSON.parse(orgRes.body).token;
const custToken = JSON.parse(custRes.body).token;
const cust2Token = JSON.parse(cust2Res.body).token;

const adminData = await createUser({ name: 'Admin', email: 'admin@bk.com', password: 'secret123', role: 'admin' });
await userRepo.insert(adminData);
const adminLoginRes = await post(app, '/auth/login', { email: 'admin@bk.com', password: 'secret123' });
const adminToken = JSON.parse(adminLoginRes.body).token;

// ── create + approve a small-capacity event ─────────────────────────────────
const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString();

const createRes = await post(app, '/events', {
  title: 'Tiny Show', description: 'Limited seats', category: 'music', location: 'NYC',
  startsAt: tomorrow, endsAt: dayAfter, capacity: 3, ticketPrice: 20,
}, { authorization: `Bearer ${orgToken}` });
const eventId = JSON.parse(createRes.body).event.id;
await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

// ── customer creates a booking ──────────────────────────────────────────────
let bookingId;
{
  const res = await post(app, '/bookings', { eventId, quantity: 2 }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 201, 'customer create booking → 201');
  const body = JSON.parse(res.body);
  assert(body.booking.status === 'confirmed', 'booking status confirmed');
  assert(body.booking.quantity === 2, 'quantity preserved');
  assert(Number(body.booking.totalAmount) === 40, 'total = price * qty');
  assert(Array.isArray(body.booking.tickets) && body.booking.tickets.length === 2, '2 tickets generated');
  assert(body.booking.tickets[0].qrCode.startsWith('data:image/png;base64,'), 'ticket has base64 PNG QR');
  assert(typeof body.booking.tickets[0].ticketNumber === 'string', 'ticket has ticketNumber');
  bookingId = body.booking.id;
}

// ── event.remaining decremented ─────────────────────────────────────────────
{
  const ev = await eventRepo.findById(eventId);
  assert(ev.remaining === 1, 'event.remaining decremented to 1');
}

// ── unauthenticated cannot book ─────────────────────────────────────────────
{
  const res = await post(app, '/bookings', { eventId, quantity: 1 });
  assertStatus(res, 401, 'unauthenticated → 401');
}

// ── organizer cannot book ───────────────────────────────────────────────────
{
  const res = await post(app, '/bookings', { eventId, quantity: 1 }, { authorization: `Bearer ${orgToken}` });
  assertStatus(res, 403, 'organizer book → 403');
}

// ── over-capacity rejected ──────────────────────────────────────────────────
{
  const res = await post(app, '/bookings', { eventId, quantity: 5 }, { authorization: `Bearer ${cust2Token}` });
  assertStatus(res, 409, 'over-capacity → 409');
}

// ── customer lists their own bookings ───────────────────────────────────────
{
  const res = await get(app, '/bookings/my', custToken);
  assertStatus(res, 200, 'list my bookings → 200');
  const body = JSON.parse(res.body);
  assert(body.bookings.length === 1, 'user has 1 booking');
  assert(body.bookings[0].tickets.length === 2, 'tickets included in list');
}

// ── second customer cannot cancel first customer's booking ──────────────────
{
  const res = await del(app, `/bookings/${bookingId}`, cust2Token);
  assertStatus(res, 403, 'non-owner cancel → 403');
}

// ── customer cancels own booking ────────────────────────────────────────────
{
  const res = await del(app, `/bookings/${bookingId}`, custToken);
  assertStatus(res, 200, 'cancel own booking → 200');
  const body = JSON.parse(res.body);
  assert(body.booking.status === 'cancelled', 'booking → cancelled');
  assert(body.booking.cancelledAt, 'cancelledAt set');
}

// ── seats returned to event ─────────────────────────────────────────────────
{
  const ev = await eventRepo.findById(eventId);
  assert(ev.remaining === 3, 'remaining restored to 3 after cancel');
}

// ── double-cancel rejected ──────────────────────────────────────────────────
{
  const res = await del(app, `/bookings/${bookingId}`, custToken);
  assertStatus(res, 422, 'double-cancel → 422');
}

// ── pending event cannot be booked ──────────────────────────────────────────
{
  const pendingRes = await post(app, '/events', {
    title: 'Not yet', description: 'pending', category: 'art', location: 'LA',
    startsAt: tomorrow, endsAt: dayAfter, capacity: 5, ticketPrice: 10,
  }, { authorization: `Bearer ${orgToken}` });
  const pendingId = JSON.parse(pendingRes.body).event.id;
  const res = await post(app, '/bookings', { eventId: pendingId, quantity: 1 }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 422, 'book pending event → 422');
}

await app.close();
await sequelize.close();
summary();
