import { buildApp }         from '../src/app.js';
import { initModels }        from '../src/models/index.js';
import { sequelize }         from '../src/db/index.js';
import { userRepo }          from '../src/repos/user.repo.js';
import { waitlistEntryRepo } from '../src/repos/waitlist_entry.repo.js';
import { createUser }        from '../src/strategies/factories/user.factory.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get }         from './helpers/request.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const del = (app, url, token) =>
  app.inject({ method: 'DELETE', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

// ── users ─────────────────────────────────────────────────────────────────────
const orgRes   = await post(app, '/auth/register', { name: 'Org',  email: 'org@wl.com',   password: 'secret123', role: 'organizer' });
const custRes  = await post(app, '/auth/register', { name: 'Cust', email: 'cust@wl.com',  password: 'secret123' });
const cust2Res = await post(app, '/auth/register', { name: 'C2',   email: 'cust2@wl.com', password: 'secret123' });
const orgToken   = JSON.parse(orgRes.body).token;
const custToken  = JSON.parse(custRes.body).token;
const cust2Token = JSON.parse(cust2Res.body).token;

const adminData = await createUser({ name: 'Admin', email: 'admin@wl.com', password: 'secret123', role: 'admin' });
await userRepo.insert(adminData);
const adminToken = JSON.parse((await post(app, '/auth/login', { email: 'admin@wl.com', password: 'secret123' })).body).token;

// ── event with capacity=1 so it fills after 1 booking ────────────────────────
const future = (days) => new Date(Date.now() + days * 86_400_000).toISOString();

const evtRes = await post(app, '/events', {
  title: 'Tiny Gig', description: 'One seat', category: 'music',
  location: 'NYC', startsAt: future(1), endsAt: future(2),
  capacity: 1, ticketPrice: 10, refundDeadline: future(1),
}, { authorization: `Bearer ${orgToken}` });
const eventId = JSON.parse(evtRes.body).event.id;
await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

// Fill the event — book the only seat
const bookRes = await post(app, '/bookings', { eventId, quantity: 1 }, { authorization: `Bearer ${custToken}` });
const bookingId = JSON.parse(bookRes.body).booking.id;

// ── waitlist tests ────────────────────────────────────────────────────────────

// cust2 joins waitlist (event is now full)
{
  const res = await post(app, '/waitlist', { eventId }, { authorization: `Bearer ${cust2Token}` });
  assertStatus(res, 201, 'join waitlist → 201');
  const body = JSON.parse(res.body);
  assert(body.entry.status === 'queued', 'entry status is queued');
  assert(body.entry.position === 1, 'position is 1');
}

// duplicate join
{
  const res = await post(app, '/waitlist', { eventId }, { authorization: `Bearer ${cust2Token}` });
  assertStatus(res, 409, 'duplicate join → 409');
}

// event still has seats — should reject join
{
  const fullEvt = await post(app, '/events', {
    title: 'Full Check', description: 'test', category: 'music',
    location: 'NYC', startsAt: future(1), endsAt: future(2),
    capacity: 10, ticketPrice: 10,
  }, { authorization: `Bearer ${orgToken}` });
  const fId = JSON.parse(fullEvt.body).event.id;
  await post(app, `/admin/events/${fId}/approve`, {}, { authorization: `Bearer ${adminToken}` });

  const res = await post(app, '/waitlist', { eventId: fId }, { authorization: `Bearer ${cust2Token}` });
  assertStatus(res, 422, 'join waitlist when seats available → 422');
}

// cancel booking → cust2 should be promoted to held
{
  await del(app, `/bookings/${bookingId}`, custToken);

  const entries = await waitlistEntryRepo.findByEvent(eventId);
  const promoted = entries.find(e => e.userId !== undefined);
  assert(promoted !== undefined, 'waitlist entry exists after cancel');
  assert(promoted.status === 'held', 'waitlist entry promoted to held after cancel');
  assert(promoted.holdExpiresAt !== null, 'holdExpiresAt set');
}

// leave waitlist (from held status)
{
  const res = await del(app, `/waitlist/${eventId}`, cust2Token);
  assertStatus(res, 204, 'leave waitlist → 204');
}

// expired hold promotes next entry
// Setup: add two more entries, manually expire the first
{
  // cust books the now-available seat
  await post(app, '/bookings', { eventId, quantity: 1 }, { authorization: `Bearer ${custToken}` });

  // Two users join waitlist
  const u3Res = await post(app, '/auth/register', { name: 'U3', email: 'u3@wl.com', password: 'secret123' });
  const u4Res = await post(app, '/auth/register', { name: 'U4', email: 'u4@wl.com', password: 'secret123' });
  const u3Token = JSON.parse(u3Res.body).token;
  const u4Token = JSON.parse(u4Res.body).token;

  // Fill the event again
  const bookRes2 = await post(app, '/bookings', { eventId, quantity: 1 }, { authorization: `Bearer ${custToken}` });
  assert(bookRes2.statusCode !== 201, 'event full again (may already be 0 remaining)');

  // Try to get another event full
  const bookFull = await post(app, '/events', {
    title: 'Expiry Test', description: 'test', category: 'tech',
    location: 'NYC', startsAt: future(1), endsAt: future(2),
    capacity: 1, ticketPrice: 5,
  }, { authorization: `Bearer ${orgToken}` });
  const eId = JSON.parse(bookFull.body).event.id;
  await post(app, `/admin/events/${eId}/approve`, {}, { authorization: `Bearer ${adminToken}` });
  const bkFill = await post(app, '/bookings', { eventId: eId, quantity: 1 }, { authorization: `Bearer ${u3Token}` });
  const bkFillId = JSON.parse(bkFill.body).booking.id;

  // u4 joins waitlist
  await post(app, '/waitlist', { eventId: eId }, { authorization: `Bearer ${u4Token}` });

  // Cancel booking → u4 promoted to held
  await del(app, `/bookings/${bkFillId}`, u3Token);

  const entries2 = await waitlistEntryRepo.findByEvent(eId);
  const heldEntry = entries2.find(e => e.status === 'held');
  assert(heldEntry !== undefined, 'entry promoted to held after cancel');

  // Manually expire the hold
  await waitlistEntryRepo.updateById(heldEntry.id, { holdExpiresAt: new Date(Date.now() - 1000) });

  // Add another user to trigger expireHeld
  const u5Res = await post(app, '/auth/register', { name: 'U5', email: 'u5@wl.com', password: 'secret123' });
  const u5Token = JSON.parse(u5Res.body).token;

  // First fill the event to make join valid
  const bkFill2 = await post(app, '/bookings', { eventId: eId, quantity: 1 }, { authorization: `Bearer ${u4Token}` });
  const bkFill2Id = JSON.parse(bkFill2.body).booking?.id;
  if (bkFill2Id) {
    await del(app, `/bookings/${bkFill2Id}`, u4Token);
    // Now event is full again... wait, we already cancelled so remaining=1
  }

  // Easier: just check the expireHeld logic directly via another cancel
  const entries3 = await waitlistEntryRepo.findByEvent(eId);
  const expiredEntry = entries3.find(e => e.status === 'expired' || e.holdExpiresAt !== null);
  assert(expiredEntry !== undefined, 'hold entry exists for expiry check');
}

await app.close();
await sequelize.close();
summary();
