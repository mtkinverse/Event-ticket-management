// Bypass /auth/register (which is customer-only since CR-A) to seed users with
// privileged roles directly via the factory + repo. Returns a logged-in JWT token.

import { createUser } from '../../src/strategies/factories/user.factory.js';
import { userRepo }   from '../../src/repos/user.repo.js';
import { post }       from './request.js';

export const seedWithRole = async (app, { name, email, password = 'secret123', role }) => {
  const data = await createUser({ name, email, password, role });
  await userRepo.insert(data);
  const loginRes = await post(app, '/auth/login', { email, password });
  return JSON.parse(loginRes.body).token;
};

export const seedOrganizer = (app, args) => seedWithRole(app, { ...args, role: 'organizer' });
export const seedAdmin     = (app, args) => seedWithRole(app, { ...args, role: 'admin' });
