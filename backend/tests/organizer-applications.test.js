process.env.NODE_ENV = 'test';
process.env.NOTIFICATION_CHANNEL = 'mock';

import { buildApp }    from '../src/app.js';
import { initModels }  from '../src/models/index.js';
import { sequelize }   from '../src/db/index.js';
import { userRepo }    from '../src/repos/user.repo.js';
import { mockChannel } from '../src/strategies/notification/index.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get }   from './helpers/request.js';
import { seedAdmin }   from './helpers/seed.js';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

// Tiny 1×1 PNG (valid magic bytes, smallest possible).
const TINY_PNG = Buffer.from(
  '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C6300010000000500010D0A2DB40000000049454E44AE426082',
  'hex',
);

const submitApplication = async (token, fields) => {
  const boundary = '----TEST' + Math.random().toString(36).slice(2);
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`);
  }
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="snapshot"; filename="proof.png"\r\nContent-Type: image/png\r\n\r\n`);
  const head = Buffer.from(parts.join(''), 'utf8');
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const payload = Buffer.concat([head, TINY_PNG, tail]);

  return app.inject({
    method: 'POST',
    url:    '/organizer-applications',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': payload.length,
    },
    payload,
  });
};

// ── users ────────────────────────────────────────────────────────────────────
const adminToken = await seedAdmin(app, { name: 'Admin', email: 'admin@oa.com' });
const custRes    = await post(app, '/auth/register', { name: 'Cust',  email: 'cust@oa.com',  password: 'secret123' });
const cust2Res   = await post(app, '/auth/register', { name: 'Cust2', email: 'cust2@oa.com', password: 'secret123' });
const custToken  = JSON.parse(custRes.body).token;
const cust2Token = JSON.parse(cust2Res.body).token;

// ── customer submits an application (happy path) ─────────────────────────────
let applicationId;
{
  mockChannel.clear();
  const res = await submitApplication(custToken, {
    businessName:       'Cust Productions',
    motivation:         'I want to host weekly tech meetups.',
    paymentAmountMinor: '500000',
    currency:           'PKR',
    paymentReference:   'TRX-12345',
  });
  assertStatus(res, 201, 'submit application → 201');
  const body = JSON.parse(res.body);
  assert(body.application.status === 'pending',          'status = pending');
  assert(body.application.businessName === 'Cust Productions', 'businessName persisted');
  assert(body.application.paymentSnapshotPath.startsWith('/uploads/snapshots/'), 'snapshot path is /uploads/snapshots/<uuid>.png');
  assert(body.application.currency === 'PKR',            'currency carried');
  assert(mockChannel.history.some(m => /received|application/i.test(m.subject) && m.to === 'cust@oa.com'),
         'organizer.application.submitted email dispatched');
  applicationId = body.application.id;
}

// ── duplicate pending submission rejected ────────────────────────────────────
{
  const res = await submitApplication(custToken, {
    businessName:       'Cust Productions 2',
    motivation:         'second try',
    paymentAmountMinor: '500000',
    currency:           'PKR',
    paymentReference:   'TRX-99999',
  });
  assertStatus(res, 409, 'duplicate pending submission → 409');
}

// ── customer cannot list pending (admin-only) ────────────────────────────────
{
  const res = await get(app, '/admin/organizer-applications', custToken);
  assertStatus(res, 403, 'customer list pending → 403');
}

// ── admin lists pending ──────────────────────────────────────────────────────
{
  const res = await get(app, '/admin/organizer-applications', adminToken);
  assertStatus(res, 200, 'admin list pending → 200');
  const body = JSON.parse(res.body);
  assert(body.applications.length === 1, 'one pending application visible');
}

// ── GET /organizer-applications/mine returns the user's latest application ──
{
  const res = await get(app, '/organizer-applications/mine', custToken);
  assertStatus(res, 200, 'GET /mine → 200');
  const body = JSON.parse(res.body);
  assert(body.application && body.application.id === applicationId, 'mine returns the submitted application');
}

// ── admin approves: user role flips, approval email lands with ?onboarded=1 ──
{
  mockChannel.clear();
  const res = await app.inject({
    method: 'POST',
    url:    `/admin/organizer-applications/${applicationId}/approve`,
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assertStatus(res, 200, 'approve → 200');
  const body = JSON.parse(res.body);
  assert(body.application.status === 'approved',  'application → approved');
  assert(body.application.reviewedBy !== null,    'reviewedBy set');
  assert(body.application.reviewedAt !== null,    'reviewedAt set');

  // user role flipped
  const updated = await userRepo.findByEmail('cust@oa.com');
  assert(updated.role === 'organizer', 'user role flipped to organizer');

  // approval email dispatched with onboarded query param in the CTA
  const email = mockChannel.history.find(m => m.to === 'cust@oa.com');
  assert(email,                                            'approval email landed for applicant');
  assert(/Welcome|organizer/i.test(email.subject),         'approval email subject mentions welcome/organizer');
  assert(email.html.includes('?onboarded=1'),              'CTA URL carries ?onboarded=1');
}

// ── newly minted organizer can now create an event ───────────────────────────
{
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
  const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString();
  const res = await post(app, '/events', {
    title: 'My First', description: 'first', category: 'music', location: 'NYC',
    startsAt: tomorrow, endsAt: dayAfter, capacity: 10, ticketPriceMinor: 0, currency: 'PKR',
  }, { authorization: `Bearer ${custToken}` });
  assertStatus(res, 201, 'newly minted organizer can create an event');
}

// ── rejection path with reason ───────────────────────────────────────────────
{
  // cust2 submits, admin rejects with a reason; cust2 stays customer; email contains reason.
  const submitRes = await submitApplication(cust2Token, {
    businessName:       'Spammy LLC',
    motivation:         'just text',
    paymentAmountMinor: '100',
    currency:           'PKR',
    paymentReference:   'BAD',
  });
  assertStatus(submitRes, 201, 'cust2 submit → 201');
  const id2 = JSON.parse(submitRes.body).application.id;

  mockChannel.clear();
  const rejectRes = await post(app, `/admin/organizer-applications/${id2}/reject`,
    { reason: 'Payment proof does not match the security-fee amount.' },
    { authorization: `Bearer ${adminToken}` });
  assertStatus(rejectRes, 200, 'reject → 200');
  const body = JSON.parse(rejectRes.body);
  assert(body.application.status === 'rejected',           'application → rejected');
  assert(body.application.rejectionReason.includes('Payment proof'), 'rejection reason persisted');

  const cust2 = await userRepo.findByEmail('cust2@oa.com');
  assert(cust2.role === 'customer', 'rejected user stays customer');

  const email = mockChannel.history.find(m => m.to === 'cust2@oa.com');
  assert(email && /not approved/i.test(email.subject),     'rejection email landed');
  assert(email.html.includes('Payment proof'),             'rejection email body contains the reason');
}

// ── unsupported mimetype rejected ────────────────────────────────────────────
{
  // Use a fresh customer for this so we don't trip the duplicate-pending guard.
  const c3Res = await post(app, '/auth/register', { name: 'C3', email: 'c3@oa.com', password: 'secret123' });
  const c3Token = JSON.parse(c3Res.body).token;

  const boundary = '----BadMime' + Math.random().toString(36).slice(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="businessName"\r\n\r\nC3\r\n`
    + `--${boundary}\r\nContent-Disposition: form-data; name="motivation"\r\n\r\nfoo\r\n`
    + `--${boundary}\r\nContent-Disposition: form-data; name="paymentAmountMinor"\r\n\r\n100\r\n`
    + `--${boundary}\r\nContent-Disposition: form-data; name="currency"\r\n\r\nPKR\r\n`
    + `--${boundary}\r\nContent-Disposition: form-data; name="paymentReference"\r\n\r\nX\r\n`
    + `--${boundary}\r\nContent-Disposition: form-data; name="snapshot"; filename="bad.txt"\r\nContent-Type: text/plain\r\n\r\nnot an image`
    + `\r\n--${boundary}--\r\n`,
    'utf8',
  );
  const res = await app.inject({
    method: 'POST',
    url:    '/organizer-applications',
    headers: {
      authorization: `Bearer ${c3Token}`,
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': head.length,
    },
    payload: head,
  });
  assertStatus(res, 422, 'non-image upload → 422');
}

await app.close();
await sequelize.close();
summary();
