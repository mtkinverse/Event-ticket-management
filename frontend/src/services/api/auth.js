import mockUsers from '../../mocks/users.mock.json';
import { mapUser } from './mappers/user.mapper.js';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const MOCK_PASSWORDS = { 'alice@example.com': 'password', 'bob@events.com': 'password', 'admin@platform.com': 'password' };

const makeFakeToken = (user) => btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 7 * 86400000 }));

export const authApi = {
  login: async ({ email, password }) => {
    await delay();
    const raw = mockUsers.find(u => u.email === email);
    if (!raw || MOCK_PASSWORDS[email] !== password) throw new Error('Invalid credentials');
    const user = mapUser(raw);
    return { user, token: makeFakeToken(raw) };
  },

  register: async ({ name, email, password, role = 'customer' }) => {
    await delay(400);
    if (mockUsers.find(u => u.email === email)) throw new Error('Email already registered');
    const raw = { id: `usr-${Date.now()}`, name, email, role, phone: null, createdAt: new Date().toISOString() };
    return { user: mapUser(raw), token: makeFakeToken(raw) };
  },

  me: async (token) => {
    await delay(200);
    if (!token) throw new Error('No token');
    const payload = JSON.parse(atob(token));
    const raw = mockUsers.find(u => u.id === payload.id);
    if (!raw) throw new Error('User not found');
    return mapUser(raw);
  },
};
