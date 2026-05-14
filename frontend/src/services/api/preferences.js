import { req } from './http.js';

export const preferencesApi = {
  list: async () => {
    const { preferences } = await req('/me/preferences');
    return preferences;
  },

  set: async (type, muted) => {
    await req(`/me/preferences/${encodeURIComponent(type)}`, {
      method: 'PUT',
      body:   JSON.stringify({ muted }),
    });
  },
};
