import { buildApp }    from '../src/app.js';
import { initModels }  from '../src/models/index.js';
import { sequelize }   from '../src/db/index.js';
import { userRepo }    from '../src/repos/user.repo.js';
import { createUser } from '../src/strategies/factories/user.factory.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get } from './helpers/request.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const del = (app, url, token) =>
  app.inject({ method: 'DELETE', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

const orgRes   = await post(app, '/auth/register', { name: 'Org',   email: 'org@wl.com',   password: 'secret123', role: 'organizer' });
const custRes  = await post(app, '/auth/register', { name: 'Cust',  email: 'cust@wl.com',  password: 'secret123', role: 'customer' });
const cust2Res = await post(app, '/auth/register', { name: 'Cust2', email: 'cust2@wl.com', password: 'secret123', role: 'customer' });
const orgToken   = JSON.parse(orgRes.body).token;
const custToken  = JSON.parse(custRes.body).token;
const cust2Token = JSON.parse(cust2Res.body).token;

const adminData = await createUser({ name: 'Admin', email: 'admin@wl.com', password: 'secret123', role: 'admin' });
await userRepo.insert(adminData);
const adminLoginRes = await post(app, '/auth/login', { email: 'admin@wl.com', password: 'secret123' });
const adminToken = JSON.parse(adminLoginRes.body).token;

const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString();

const createRes = await post(app, '/events', {
  title: 'Sold Out Show', description: 'No seats', category: 'music', location: 'NYC',
  startsAt: tomorrow, endsAt: dayAfter, capacity: 1, ticketPrice: 50,
}, { authorization: `Bearer ${orgToken}` });
const eventId = JSON.parse(createRes.body).event.id;
await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

// ── fill capacity so remaining hits 0 (waitlist join requires a full event) ─
{
  const res = await post(app, '/bookings', { eventId, quantity: 1 }, { authorization: `Bearer ${cust2Token}` });
  assertStatus(res, 201, 'second customer books the last seat → 201');
}

// ── joining a non-full event is rejected ────────────────────────────────────
{
  // create a separate event that still has seats
  const openEventRes = await post(app, '/events', {
    title: 'Has Seats', description: 'open', category: 'music', location: 'NYC',
    startsAt: tomorrow, endsAt: dayAfter, capacity: 5, ticketPrice: 25,
  }, { authorization: `Bearer ${orgToken}` });
  const openId = JSON.parse(openEventRes.body).event.id;
  await post(app, `/admin/events/${openId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

  const res = await post(app, '/waitlist', { eventId: openId }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 422, 'join non-full event → 422');
}

// ── customer joins waitlist ─────────────────────────────────────────────────
{
  const res = await post(app, '/waitlist', { eventId }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 201, 'join waitlist → 201');
  const body = JSON.parse(res.body);
  assert(body.entry.status === 'waiting', 'entry status = waiting');
  assert(body.entry.eventId === eventId, 'eventId on entry');
}

// ── duplicate join rejected ─────────────────────────────────────────────────
{
  const res = await post(app, '/waitlist', { eventId }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 409, 'duplicate join → 409');
}

// ── organizer cannot join ───────────────────────────────────────────────────
{
  const res = await post(app, '/waitlist', { eventId }, { authorization: `Bearer ${orgToken}` });
  assertStatus(res, 403, 'organizer join → 403');
}

// ── unauthenticated rejected ────────────────────────────────────────────────
{
  const res = await post(app, '/waitlist', { eventId });
  assertStatus(res, 401, 'unauth join → 401');
}

// ── customer leaves waitlist ────────────────────────────────────────────────
{
  const res = await del(app, `/waitlist/${eventId}`, custToken);
  assertStatus(res, 200, 'leave waitlist → 200');
}

// ── leave when not on list → 404 ────────────────────────────────────────────
{
  const res = await del(app, `/waitlist/${eventId}`, custToken);
  assertStatus(res, 404, 'leave when absent → 404');
}

await app.close();
await sequelize.close();
summary();
