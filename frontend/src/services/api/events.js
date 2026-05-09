import { req } from './http.js';
import { mapEvent, mapEventList } from './mappers/event.mapper.js';

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && v !== 'all' && s.append(k, v));
  const str = s.toString();
  return str ? `?${str}` : '';
};

export const eventsApi = {
  getAll: async (filters = {}) => {
    const { events } = await req(`/events${qs(filters)}`);
    return mapEventList(events);
  },

  getFeatured: async () => {
    const { events } = await req('/events/top');
    return mapEventList(events);
  },

  getById: async (id) => {
    const { event } = await req(`/events/${id}`);
    return mapEvent(event);
  },

  getRelated: async (id) => {
    const { events } = await req(`/events/${id}/related`);
    return mapEventList(events);
  },

  getByOrganizer: async () => {
    const { events } = await req('/events/mine');
    return mapEventList(events);
  },

  getPending: async () => {
    const { events } = await req('/admin/events');
    return mapEventList(events);
  },

  create: async (data) => {
    const { event } = await req('/events', { method: 'POST', body: JSON.stringify(data) });
    return mapEvent(event);
  },

  approve: async (id) => {
    const { event } = await req(`/admin/events/${id}/approve`, { method: 'POST' });
    return mapEvent(event);
  },

  reject: async (id, reason) => {
    const { event } = await req(`/admin/events/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    return mapEvent(event);
  },
};
