import mockBookings from '../../mocks/bookings.mock.json';
import mockEvents from '../../mocks/events.mock.json';
import { mapBooking, mapBookingList } from './mappers/booking.mapper.js';
import { mapEvent } from './mappers/event.mapper.js';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export const bookingsApi = {
  getMyBookings: async (userId) => {
    await delay();
    const bookings = mockBookings.filter(b => b.userId === userId);
    return bookings.map(b => {
      const event = mockEvents.find(e => e.id === b.eventId);
      return { ...mapBooking(b), event: event ? mapEvent(event) : null };
    });
  },

  create: async ({ userId, eventId, quantity }) => {
    await delay(500);
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    if (event.remaining < quantity) throw new Error('Not enough tickets available');
    const totalAmount = event.ticketPrice * quantity;
    const raw = { id: `bkg-${Date.now()}`, userId, eventId, quantity, totalAmount, status: 'confirmed', placedAt: new Date().toISOString() };
    return { booking: mapBooking(raw), event: mapEvent(event) };
  },

  cancel: async (bookingId) => {
    await delay();
    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    return mapBooking({ ...booking, status: 'cancelled' });
  },

  joinWaitlist: async ({ userId, eventId }) => {
    await delay();
    return { id: `wl-${Date.now()}`, userId, eventId, position: 3, status: 'queued' };
  },
};
