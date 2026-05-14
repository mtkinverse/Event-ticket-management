process.env.NODE_ENV = 'test';
process.env.NOTIFICATION_CHANNEL = 'mock';

import { buildApp }            from '../src/app.js';
import { initModels }          from '../src/models/index.js';
import { sequelize }           from '../src/db/index.js';
import { userRepo }            from '../src/repos/user.repo.js';
import { waitlistEntryRepo }   from '../src/repos/waitlist_entry.repo.js';
import { createUser }          from '../src/strategies/factories/user.factory.js';
import { mockChannel }         from '../src/strategies/notification/index.js';
import { seedOrganizer, seedAdmin } from './helpers/seed.js';
import { config }              from '../src/configs/index.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get }           from './helpers/request.js';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const del = (app, url, token) =>
  app.inject({ method: 'DELETE', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

const orgToken   = await seedOrganizer(app, { name: 'Org',   email: 'org@wl.com' });
const adminToken = await seedAdmin(app,     { name: 'Admin', email: 'admin@wl.com' });
const custRes    = await post(app, '/auth/register', { name: 'Cust',  email: 'cust@wl.com',  password: 'secret123' });
const cust2Res   = await post(app, '/auth/register', { name: 'Cust2', email: 'cust2@wl.com', password: 'secret123' });
const custToken  = JSON.parse(custRes.body).token;
const cust2Token = JSON.parse(cust2Res.body).token;

const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString();

const createRes = await post(app, '/events', {
  title: 'Sold Out Show', description: 'No seats', category: 'music', location: 'NYC',
  startsAt: tomorrow, endsAt: dayAfter, capacity: 1, ticketPriceMinor: 0, currency: 'PKR',
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
    startsAt: tomorrow, endsAt: dayAfter, capacity: 5, ticketPriceMinor: 0, currency: 'PKR',
  }, { authorization: `Bearer ${orgToken}` });
  const openId = JSON.parse(openEventRes.body).event.id;
  await post(app, `/admin/events/${openId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

  const res = await post(app, '/waitlist', { eventId: openId }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 422, 'join non-full event → 422');
}

// ── customer joins waitlist ─────────────────────────────────────────────────
{
  mockChannel.clear();
  const res = await post(app, '/waitlist', { eventId }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 201, 'join waitlist → 201');
  const body = JSON.parse(res.body);
  assert(body.entry.status === 'waiting', 'entry status = waiting');
  assert(body.entry.eventId === eventId, 'eventId on entry');
  assert(mockChannel.history.some(m => m.to === 'cust@wl.com' && /waitlist/i.test(m.subject)),
         'waitlist.joined email dispatched to joiner');
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

// ── GET /waitlist/my returns user entries enriched with slim event ──────────
{
  // re-join so we have something to list
  await post(app, '/waitlist', { eventId }, { authorization: `Bearer ${custToken}` });

  const res = await get(app, '/waitlist/my', custToken);
  assertStatus(res, 200, 'GET /waitlist/my → 200');
  const body = JSON.parse(res.body);
  assert(body.entries.length === 1,                   'one entry returned');
  assert(body.entries[0].eventId === eventId,         'entry.eventId matches');
  assert(body.entries[0].event,                       'entry.event payload included');
  assert(body.entries[0].event.title === 'Sold Out Show', 'entry.event.title via bulk fetch');
}

// ── promote-on-cancel: cust2 cancels → cust promoted to held + emailed ─────
{
  mockChannel.clear();

  // find cust2's booking via DB
  const cust2 = await userRepo.findByEmail('cust2@wl.com');
  const [b] = await sequelize.models.Booking.findAll({ where: { userId: cust2.id, eventId } });
  assert(b, 'cust2 has a booking before cancel');

  const cancelRes = await del(app, `/bookings/${b.id}`, cust2Token);
  assertStatus(cancelRes, 200, 'cust2 cancels booking → 200');

  // first waiting entry is now 'held'
  const entry = await waitlistEntryRepo.findByUserAndEvent((await userRepo.findByEmail('cust@wl.com')).id, eventId);
  assert(entry.status === 'held',                  'first waiting entry promoted to held');
  assert(entry.holdExpiresAt !== null,             'holdExpiresAt set');
  const skew = Math.abs(new Date(entry.holdExpiresAt).getTime() - (Date.now() + config.waitlistHoldMinutes * 60_000));
  assert(skew < 5_000,                             'holdExpiresAt ≈ now + waitlistHoldMinutes (±5s)');

  // promoted user got an email
  assert(mockChannel.history.some(m => m.to === 'cust@wl.com' && /seat opened|promoted|book/i.test(m.subject)),
         'waitlist.promoted email sent to first waiting user');
  // cust2 got booking.cancelled
  assert(mockChannel.history.some(m => m.to === 'cust2@wl.com' && /cancelled/i.test(m.subject)),
         'booking.cancelled email sent to canceller');
}

// ── auto-clear waitlist on booking: held user books → entry deleted ────────
{
  // cust is currently held for eventId; cust books that event
  const bookRes = await post(app, '/bookings', { eventId, quantity: 1 }, { authorization: `Bearer ${custToken}` });
  assertStatus(bookRes, 201, 'held user books seat → 201');

  // their waitlist entry should be gone
  const remaining = await waitlistEntryRepo.findByUserAndEvent((await userRepo.findByEmail('cust@wl.com')).id, eventId);
  assert(remaining === null, 'cust waitlist entry auto-cleared after booking');
}

await app.close();
await sequelize.close();
summary();
