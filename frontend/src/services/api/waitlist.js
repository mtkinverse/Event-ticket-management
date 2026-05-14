import { req } from './http.js';
import { mapWaitlistEntry, mapWaitlistEntryList } from './mappers/waitlist.mapper.js';

export const waitlistApi = {
  join: async ({ eventId }) => {
    const { entry } = await req('/waitlist', { method: 'POST', body: JSON.stringify({ eventId }) });
    return mapWaitlistEntry(entry);
  },

  getMy: async () => {
    const { entries } = await req('/waitlist/my');
    return mapWaitlistEntryList(entries);
  },

  leave: async (eventId) => {
    return req(`/waitlist/${eventId}`, { method: 'DELETE' });
  },
};
