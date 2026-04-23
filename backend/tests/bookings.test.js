import { buildApp }   from '../src/app.js';
import { initModels } from '../src/models/index.js';
import { sequelize }  from '../src/db/index.js';
import { userRepo }   from '../src/repos/user.repo.js';
import { createUser } from '../src/strategies/factories/user.factory.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get }  from './helpers/request.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const del = (app, url, token) =>
  app.inject({ method: 'DELETE', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

// ── users ─────────────────────────────────────────────────────────────────────
const orgRes  = await post(app, '/auth/register', { name: 'Org',  email: 'org@b.com',  password: 'secret123', role: 'organizer' });
const custRes = await post(app, '/auth/register', { name: 'Cust', email: 'cust@b.com', password: 'secret123' });
const orgToken  = JSON.parse(orgRes.body).token;
const custToken = JSON.parse(custRes.body).token;
const custId    = JSON.parse(custRes.body).user.id;

const adminData = await createUser({ name: 'Admin', email: 'admin@b.com', password: 'secret123', role: 'admin' });
await userRepo.insert(adminData);
const adminToken = JSON.parse((await post(app, '/auth/login', { email: 'admin@b.com', password: 'secret123' })).body).token;

// ── event setup ───────────────────────────────────────────────────────────────
const future = (days) => new Date(Date.now() + days * 86_400_000).toISOString();

const eventPayload = {
  title: 'Concert', description: 'Live music', category: 'music',
  location: 'NYC', startsAt: future(1), endsAt: future(2),
  capacity: 5, ticketPrice: 20,
  refundDeadline: future(1),
};

const evtRes = await post(app, '/events', eventPayload, { authorization: `Bearer ${orgToken}` });
const eventId = JSON.parse(evtRes.body).event.id;
await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

// ── event with past refund deadline (for cancel test) ────────────────────────
const pastDeadlinePayload = { ...eventPayload, title: 'Old', refundDeadline: new Date(Date.now() - 1000).toISOString() };
const pastEvtRes = await post(app, '/events', pastDeadlinePayload, { authorization: `Bearer ${orgToken}` });
const pastEventId = JSON.parse(pastEvtRes.body).event.id;
await post(app, `/admin/events/${pastEventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

// ── inactive event ────────────────────────────────────────────────────────────
const pendingEvtRes = await post(app, '/events', { ...eventPayload, title: 'Pending' }, { authorization: `Bearer ${orgToken}` });
const pendingEventId = JSON.parse(pendingEvtRes.body).event.id;

let bookingId;

// book successfully
{
  const res = await post(app, '/bookings', { eventId, quantity: 2 }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 201, 'book event → 201');
  const body = JSON.parse(res.body);
  assert(body.booking.status === 'confirmed', 'booking status is confirmed');
  assert(Array.isArray(body.booking.tickets), 'booking includes tickets array');
  assert(body.booking.tickets.length === 2, 'correct ticket count');
  assert(body.booking.tickets[0].qrCode.startsWith('data:image/png;base64,'), 'ticket has QR code');
  bookingId = body.booking.id;
}

// not enough seats
{
  const res = await post(app, '/bookings', { eventId, quantity: 10 }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 409, 'overbooking → 409');
}

// inactive event
{
  const res = await post(app, '/bookings', { eventId: pendingEventId, quantity: 1 }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 422, 'book inactive event → 422');
}

// get my bookings (includes tickets)
{
  const res = await get(app, '/bookings/my', custToken);
  assertStatus(res, 200, 'my bookings → 200');
  const body = JSON.parse(res.body);
  assert(body.bookings.length >= 1, 'bookings returned');
  assert(Array.isArray(body.bookings[0].tickets), 'bookings include tickets');
}

// cancel past refund deadline
{
  const pastRes = await post(app, '/bookings', { eventId: pastEventId, quantity: 1 }, { authorization: `Bearer ${custToken}` });
  const pastBookingId = JSON.parse(pastRes.body).booking.id;
  const res = await del(app, `/bookings/${pastBookingId}`, custToken);
  assertStatus(res, 422, 'cancel past deadline → 422');
}

// cancel booking — should restore remaining + not belong to another user
{
  const otherCust = await post(app, '/auth/register', { name: 'Other', email: 'other@b.com', password: 'secret123' });
  const otherToken = JSON.parse(otherCust.body).token;

  const res = await del(app, `/bookings/${bookingId}`, otherToken);
  assertStatus(res, 403, "cancel other user's booking → 403");
}

{
  const beforeRes = await get(app, `/events/${eventId}`);
  const remainingBefore = JSON.parse(beforeRes.body).event.remaining;

  const res = await del(app, `/bookings/${bookingId}`, custToken);
  assertStatus(res, 200, 'cancel own booking → 200');
  const body = JSON.parse(res.body);
  assert(body.booking.status === 'cancelled', 'booking cancelled');

  const afterRes = await get(app, `/events/${eventId}`);
  const remainingAfter = JSON.parse(afterRes.body).event.remaining;
  assert(remainingAfter === remainingBefore + 2, 'remaining restored after cancel');
}

await app.close();
await sequelize.close();
summary();
