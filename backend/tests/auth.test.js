import { buildApp } from '../src/app.js';
import { initModels } from '../src/models/index.js';
import { sequelize } from '../src/db/index.js';
import { assert, assertStatus, summary } from './helpers/assert.js';
import { post, get } from './helpers/request.js';

process.env.NODE_ENV = 'test';

await initModels();
await sequelize.sync({ force: true });

const app = await buildApp();

const user = { name: 'Alice', email: 'alice@test.com', password: 'secret123' };
let token;

// --- register ---
{
  const res = await post(app, '/auth/register', user);
  assertStatus(res, 201, 'register → 201');
  const body = JSON.parse(res.body);
  assert(!!body.token, 'register returns token');
  assert(!body.user.passwordHash, 'register does not expose passwordHash');
  token = body.token;
}

// duplicate email
{
  const res = await post(app, '/auth/register', user);
  assertStatus(res, 409, 'duplicate email → 409');
}

// missing fields
{
  const res = await post(app, '/auth/register', { email: 'x@x.com' });
  assertStatus(res, 400, 'missing fields → 400');
}

// --- login ---
{
  const res = await post(app, '/auth/login', { email: user.email, password: user.password });
  assertStatus(res, 200, 'login → 200');
  const body = JSON.parse(res.body);
  assert(!!body.token, 'login returns token');
}

// wrong password
{
  const res = await post(app, '/auth/login', { email: user.email, password: 'wrong' });
  assertStatus(res, 401, 'wrong password → 401');
}

// unknown email
{
  const res = await post(app, '/auth/login', { email: 'nobody@test.com', password: 'x' });
  assertStatus(res, 401, 'unknown email → 401');
}

// --- profile ---
{
  const res = await get(app, '/auth/profile', token);
  assertStatus(res, 200, 'profile authenticated → 200');
  const body = JSON.parse(res.body);
  assert(body.user.email === user.email, 'profile returns correct user');
}

// no token
{
  const res = await get(app, '/auth/profile', null);
  assertStatus(res, 401, 'profile no token → 401');
}

// bad token
{
  const res = await get(app, '/auth/profile', 'bad.token.here');
  assertStatus(res, 401, 'profile bad token → 401');
}

await app.close();
await sequelize.close();
summary();
