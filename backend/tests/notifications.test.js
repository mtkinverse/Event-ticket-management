process.env.NODE_ENV = 'test';
process.env.NOTIFICATION_CHANNEL = 'mock';

import { buildApp }    from '../src/app.js';
import { initModels }  from '../src/models/index.js';
import { sequelize }   from '../src/db/index.js';
import { userRepo }    from '../src/repos/user.repo.js';
import { notificationRepo } from '../src/repos/notification.repo.js';
import { createUser }  from '../src/strategies/factories/user.factory.js';
import { populateTemplate } from '../src/utils/template.js';
import { getTemplate, templates } from '../src/configs/templates.config.js';
import { notificationService } from '../src/services/notification.service.js';
import { mockChannel } from '../src/strategies/notification/index.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get } from './helpers/request.js';
import { reset } from './helpers/notifications.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const del = (app, url, token) =>
  app.inject({ method: 'DELETE', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

// ── templates: every key renders cleanly + carries theme markers ─────────────
{
  const stubUser  = { id: '00000000-0000-0000-0000-000000000001', name: 'Ada Lovelace', email: 'ada@test.com' };
  const stubEvent = { id: 'evt-1', title: 'Music Night', location: 'NYC', startsAt: new Date('2026-09-01T19:00:00Z').toISOString(), refundDeadline: null, status: 'active' };
  const stubBooking = { id: 'bk-1', quantity: 2, totalAmount: '50.00' };
  const stubTicket  = { id: 'tk-1', ticketNumber: 'TKT-ABC123', qrCode: 'data:image/png;base64,iVBORw0KGgo=' };

  const cases = [
    ['booking.confirmed', { user: stubUser, event: stubEvent, tickets: [stubTicket, { ...stubTicket, id: 'tk-2' }], booking: stubBooking }],
    ['booking.cancelled', { user: stubUser, event: stubEvent, booking: stubBooking }],
    ['waitlist.joined',   { user: stubUser, event: stubEvent }],
    ['waitlist.promoted', { user: stubUser, event: stubEvent, holdExpiresAt: new Date('2026-08-15T10:00:00Z') }],
    ['event.approved',    { user: stubUser, event: stubEvent }],
    ['event.rejected',    { user: stubUser, event: stubEvent, reason: 'Photos blurry' }],
  ];

  for (const [type, payload] of cases) {
    const out = populateTemplate(type, payload);
    assert(typeof out.subject === 'string' && out.subject.length > 0, `${type}: subject is non-empty`);
    assert(typeof out.html === 'string' && out.html.length > 200,     `${type}: html is non-trivial`);
    assert(out.html.includes('#0F1B3D'),                              `${type}: html includes primary navy`);
    assert(out.html.includes('#FF5A1F'),                              `${type}: html includes accent orange`);
    assert(out.html.includes('max-width:600px'),                      `${type}: html caps at 600px`);
    assert(out.html.includes('@media only screen and (max-width: 600px)'), `${type}: html has mobile @media rule`);
  }

  // Attachments wired for the booking-confirmation type
  const conf = populateTemplate('booking.confirmed', cases[0][1]);
  assert(conf.attachments.length === 2, 'booking.confirmed: one attachment per ticket');
  assert(conf.attachments[0].cid.startsWith('qr-'), 'attachment cid is qr-<id>');

  // event.rejected includes the reason
  const rej = populateTemplate('event.rejected', cases[5][1]);
  assert(rej.html.includes('Photos blurry'), 'event.rejected: reason is in html');
}

// ── getTemplate throws on unknown type ──────────────────────────────────────
{
  let threw = false;
  try { getTemplate('does.not.exist'); } catch { threw = true; }
  assert(threw, 'getTemplate(unknown) throws');
  assert(Object.keys(templates).length === 6, 'six template keys registered');
}

// ── notify happy path persists a row with status=sent ───────────────────────
{
  reset();
  const userData = await createUser({ name: 'Notif User', email: 'notif@nt.com', password: 'secret123', role: 'customer' });
  const inserted = await userRepo.insert(userData);

  await notificationService.notify({
    user: inserted,
    type: 'waitlist.joined',
    payload: { event: { id: 'e1', title: 'Test Event', location: 'NYC', startsAt: new Date().toISOString() } },
  });

  assert(mockChannel.history.length === 1, 'mock channel received 1 message');
  assert(mockChannel.last().to === 'notif@nt.com', 'mock channel addressed to user.email');

  const rows = await notificationRepo.findAll({ userId: inserted.id });
  assert(rows.length === 1,                  'notification row inserted');
  assert(rows[0].status === 'sent',          'row status = sent');
  assert(rows[0].channel === 'mock',         'row channel = mock');
  assert(rows[0].type === 'waitlist.joined', 'row type matches');
  assert(rows[0].providerId !== null,        'providerId recorded');
  assert(rows[0].sentAt !== null,            'sentAt recorded');
}

// ── notify failure path: row recorded with status=failed, caller unaffected ─
{
  reset();
  const userData = await createUser({ name: 'Failing User', email: 'fail@nt.com', password: 'secret123', role: 'customer' });
  const inserted = await userRepo.insert(userData);

  const originalSend = mockChannel.send;
  mockChannel.send = async () => { throw new Error('SMTP exploded'); };

  const result = await notificationService.notify({
    user: inserted,
    type: 'waitlist.joined',
    payload: { event: { id: 'e2', title: 'Boom', location: 'NYC', startsAt: new Date().toISOString() } },
  });

  mockChannel.send = originalSend;

  assert(result !== null, 'notify still returned a row id even on send failure');

  const rows = await notificationRepo.findAll({ userId: inserted.id });
  assert(rows.length === 1,                      'row inserted despite send failure');
  assert(rows[0].status === 'failed',            'row marked failed');
  assert(rows[0].errorMessage === 'SMTP exploded', 'errorMessage captured');
}

// ── notify with missing user is a silent no-op ──────────────────────────────
{
  reset();
  const before = mockChannel.history.length;
  const id1 = await notificationService.notify({ user: null, type: 'waitlist.joined', payload: {} });
  const id2 = await notificationService.notify({ user: { id: 'x' }, type: 'waitlist.joined', payload: {} }); // missing email
  assert(id1 === null,                       'null user → null return');
  assert(id2 === null,                       'user without email → null return');
  assert(mockChannel.history.length === before, 'no email dispatched');
}

// ── booking flow: confirmation lands; booking still confirmed when notify fails ──
{
  reset();
  // organizer + customer + admin
  const orgToken  = JSON.parse((await post(app, '/auth/register', { name: 'O',  email: 'o@bk.com', password: 'secret123', role: 'organizer' })).body).token;
  const custToken = JSON.parse((await post(app, '/auth/register', { name: 'C',  email: 'c@bk.com', password: 'secret123', role: 'customer' })).body).token;
  const adminData = await createUser({ name: 'A', email: 'a@bk.com', password: 'secret123', role: 'admin' });
  await userRepo.insert(adminData);
  const adminToken = JSON.parse((await post(app, '/auth/login', { email: 'a@bk.com', password: 'secret123' })).body).token;

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
  const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString();

  const evRes = await post(app, '/events', { title: 'Notif Event', description: 'x', category: 'music', location: 'LA',
                                              startsAt: tomorrow, endsAt: dayAfter, capacity: 5, ticketPrice: 25 },
                            { authorization: `Bearer ${orgToken}` });
  const eventId = JSON.parse(evRes.body).event.id;

  // approval fires event.approved to organizer
  await post(app, `/admin/events/${eventId}/approve`, {}, { authorization: `Bearer ${adminToken}` });
  assert(mockChannel.history.some(m => /approved|live/i.test(m.subject)), 'event.approved email sent to organizer');

  // booking fires booking.confirmed to customer
  reset();
  const bookRes = await post(app, '/bookings', { eventId, quantity: 2 }, { authorization: `Bearer ${custToken}` });
  assertStatus(bookRes, 201, 'booking create → 201');
  assert(mockChannel.history.length === 1, 'booking.confirmed email sent');
  assert(mockChannel.last().to === 'c@bk.com', 'email addressed to booker');
  assert(mockChannel.last().attachments.length === 2, 'qr attachments included');

  // failure path during booking: notify throws — booking still succeeds
  reset();
  const orig = mockChannel.send;
  mockChannel.send = async () => { throw new Error('SMTP down'); };
  const bookRes2 = await post(app, '/bookings', { eventId, quantity: 1 }, { authorization: `Bearer ${custToken}` });
  mockChannel.send = orig;
  assertStatus(bookRes2, 201, 'booking succeeds even when SMTP throws');
  // verify a failed row was persisted
  const cust = await userRepo.findByEmail('c@bk.com');
  const rows = await notificationRepo.findAll({ userId: cust.id, type: 'booking.confirmed' });
  assert(rows.some(r => r.status === 'failed'), 'failed notification row persisted');
}

await app.close();
await sequelize.close();
summary();
