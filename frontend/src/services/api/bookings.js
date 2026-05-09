import { req } from './http.js';
import { mapBooking } from './mappers/booking.mapper.js';

export const bookingsApi = {
  getMyBookings: async () => {
    const { bookings } = await req('/bookings/my');
    return bookings.map(mapBooking);
  },

  create: async ({ eventId, quantity }) => {
    const { booking } = await req('/bookings', { method: 'POST', body: JSON.stringify({ eventId, quantity }) });
    return { booking: mapBooking(booking) };
  },

  cancel: async (bookingId) => {
    const { booking } = await req(`/bookings/${bookingId}`, { method: 'DELETE' });
    return mapBooking(booking);
  },

  joinWaitlist: async ({ eventId }) => {
    const { entry } = await req('/waitlist', { method: 'POST', body: JSON.stringify({ eventId }) });
    return entry;
  },
};
