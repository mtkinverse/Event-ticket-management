import { buildApp }    from '../src/app.js';
import { initModels }  from '../src/models/index.js';
import { sequelize }   from '../src/db/index.js';
import { userRepo }    from '../src/repos/user.repo.js';
import { createUser }  from '../src/strategies/factories/user.factory.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get }   from './helpers/request.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

// ── helpers ──────────────────────────────────────────────────────────────────
const patch = (app, url, body, token) =>
  app.inject({ method: 'PATCH', url, payload: body, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) } });

// ── setup users ───────────────────────────────────────────────────────────────
const orgRes  = await post(app, '/auth/register', { name: 'Organizer', email: 'org@evt.com',  password: 'secret123', role: 'organizer' });
const custRes = await post(app, '/auth/register', { name: 'Customer',  email: 'cust@evt.com', password: 'secret123', role: 'customer' });
const orgToken  = JSON.parse(orgRes.body).token;
const custToken = JSON.parse(custRes.body).token;

const adminData = await createUser({ name: 'Admin', email: 'admin@evt.com', password: 'secret123', role: 'admin' });
await userRepo.insert(adminData);
const adminLoginRes = await post(app, '/auth/login', { email: 'admin@evt.com', password: 'secret123' });
const adminToken = JSON.parse(adminLoginRes.body).token;

// ── event payload ─────────────────────────────────────────────────────────────
const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
const dayAfter  = new Date(Date.now() + 2 * 86_400_000).toISOString();

const eventPayload = {
  title:       'Jazz Night',
  description: 'Live jazz downtown',
  category:    'music',
  location:    'New York',
  startsAt:    tomorrow,
  endsAt:      dayAfter,
  capacity:    100,
  ticketPrice: 25,
};

let eventId;

// ── create event ──────────────────────────────────────────────────────────────
{
  const res = await post(app, '/events', eventPayload, { authorization: `Bearer ${orgToken}` });
  assertStatus(res, 201, 'organizer create event → 201');
  const body = JSON.parse(res.body);
  assert(body.event.status === 'pending', 'new event status is pending');
  assert(!body.event.updatedAt, 'updatedAt stripped from response');
  eventId = body.event.id;
}

// customer cannot create
{
  const res = await post(app, '/events', eventPayload, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 403, 'customer create event → 403');
}

// missing required field
{
  const res = await post(app, '/events', { title: 'x' }, { authorization: `Bearer ${orgToken}` });
  assertStatus(res, 400, 'missing fields → 400');
}

// ── public reads (event still pending) ───────────────────────────────────────
{
  const res = await get(app, '/events');
  assertStatus(res, 200, 'list events → 200');
  const body = JSON.parse(res.body);
  assert(Array.isArray(body.events), 'list returns array');
  assert(body.events.length === 0, 'pending event not visible in public list');
}

{
  const res = await get(app, '/events/top');
  assertStatus(res, 200, 'top events → 200');
}

{
  const res = await get(app, `/events/${eventId}`);
  assertStatus(res, 200, 'get single event → 200');
}

{
  const res = await get(app, `/events/00000000-0000-0000-0000-000000000000`);
  assertStatus(res, 404, 'get non-existent event → 404');
}

// ── admin operations ──────────────────────────────────────────────────────────
{
  const res = await get(app, '/admin/events', adminToken);
  assertStatus(res, 200, 'admin list pending → 200');
  const body = JSON.parse(res.body);
  assert(body.events.length === 1, 'admin sees 1 pending event');
}

// non-admin cannot approve
{
  const res = await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 403, 'non-admin approve → 403');
}

// admin approve
{
  const res = await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });
  assertStatus(res, 200, 'admin approve → 200');
  const body = JSON.parse(res.body);
  assert(body.event.status === 'active', 'event status → active after approve');
}

// double-approve should fail (422 — state machine)
{
  const res = await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });
  assertStatus(res, 422, 'double-approve → 422 (state machine)');
}

// public list now shows the active event
{
  const res = await get(app, '/events');
  const body = JSON.parse(res.body);
  assert(body.events.length === 1, 'approved event visible in public list');
}

// filter by category
{
  const res = await get(app, '/events?category=music');
  const body = JSON.parse(res.body);
  assert(body.events.length === 1, 'category filter returns matching event');
}

{
  const res = await get(app, '/events?category=sports');
  const body = JSON.parse(res.body);
  assert(body.events.length === 0, 'category filter returns empty for non-match');
}

// related events
{
  const res = await get(app, `/events/${eventId}/related`);
  assertStatus(res, 200, 'related events → 200');
}

// organizer mine
{
  const res = await get(app, '/events/mine', orgToken);
  assertStatus(res, 200, 'organizer mine → 200');
  const body = JSON.parse(res.body);
  assert(body.events.length === 1, 'organizer sees their own event');
}

// ── reject flow: create a second event then reject it ────────────────────────
const orgRes2 = await post(app, '/events', { ...eventPayload, title: 'Reject Me' }, { authorization: `Bearer ${orgToken}` });
const eventId2 = JSON.parse(orgRes2.body).event.id;

{
  const res = await post(app, `/admin/events/${eventId2}/reject`, { reason: 'Incomplete info' }, { authorization: `Bearer ${adminToken}` });
  assertStatus(res, 200, 'admin reject → 200');
  const body = JSON.parse(res.body);
  assert(body.event.status === 'cancelled', 'event status → cancelled after reject');
  assert(body.event.rejectionReason === 'Incomplete info', 'rejection reason stored');
}

// ── organizer update ──────────────────────────────────────────────────────────
const orgRes3 = await post(app, '/events', { ...eventPayload, title: 'Update Me' }, { authorization: `Bearer ${orgToken}` });
const eventId3 = JSON.parse(orgRes3.body).event.id;

{
  const res = await patch(app, `/events/${eventId3}`, { description: 'Updated desc' }, orgToken);
  assertStatus(res, 200, 'organizer update own event → 200');
}

// customer cannot update
{
  const res = await patch(app, `/events/${eventId3}`, { description: 'Hack' }, custToken);
  assertStatus(res, 403, 'non-owner update → 403');
}

// ── cleanup ───────────────────────────────────────────────────────────────────
await app.close();
await sequelize.close();
summary();
