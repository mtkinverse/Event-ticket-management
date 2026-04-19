import mockEvents from '../../mocks/events.mock.json';
import { mapEvent, mapEventList } from './mappers/event.mapper.js';

const delay = (ms = 250) => new Promise(r => setTimeout(r, ms));

const applyFilters = (list, { category, search, status = 'active' }) => {
  let data = list.filter(e => e.status === status || status === 'all');
  if (category && category !== 'all') data = data.filter(e => e.category === category);
  if (search) data = data.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
  return data;
};

export const eventsApi = {
  getAll: async (filters = {}) => {
    await delay();
    return mapEventList(applyFilters(mockEvents, filters));
  },

  getFeatured: async () => {
    await delay();
    return mapEventList(mockEvents.filter(e => e.status === 'active').slice(0, 4));
  },

  getById: async (id) => {
    await delay();
    const event = mockEvents.find(e => e.id === id);
    if (!event) throw new Error('Event not found');
    return mapEvent(event);
  },

  getRelated: async (id) => {
    await delay();
    const event = mockEvents.find(e => e.id === id);
    const related = mockEvents.filter(e => e.id !== id && e.category === event?.category && e.status === 'active').slice(0, 3);
    return mapEventList(related);
  },

  getByOrganizer: async (organizerId) => {
    await delay();
    return mapEventList(mockEvents.filter(e => e.organizerId === organizerId));
  },

  getPending: async () => {
    await delay();
    return mapEventList(mockEvents.filter(e => e.status === 'pending'));
  },

  create: async (data) => {
    await delay(400);
    const newEvent = { id: `evt-${Date.now()}`, ...data, status: 'pending', remaining: data.capacity, createdAt: new Date().toISOString() };
    return mapEvent(newEvent);
  },

  approve: async (id) => {
    await delay();
    const event = mockEvents.find(e => e.id === id);
    return mapEvent({ ...event, status: 'active' });
  },

  reject: async (id) => {
    await delay();
    const event = mockEvents.find(e => e.id === id);
    return mapEvent({ ...event, status: 'rejected' });
  },
};
