import { mapUser } from './mappers/user.mapper.js';

const BASE = import.meta.env.VITE_API_URL;

const req = async (path, opts = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Request failed');
  return body;
};

export const authApi = {
  login: async ({ email, password }) => {
    const { user, token } = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { user: mapUser(user), token };
  },

  register: async ({ name, email, password, role = 'customer' }) => {
    const { user, token } = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    return { user: mapUser(user), token };
  },

  me: async (token) => {
    const { user } = await req('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return mapUser(user);
  },
};
