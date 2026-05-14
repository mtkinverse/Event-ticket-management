import { v4 as uuidv4 } from 'uuid';

export const createBooking = ({ userId, eventId, quantity, ticketPriceMinor = 0, currency = 'PKR' }) => ({
  id:               uuidv4(),
  userId,
  eventId,
  quantity,
  totalAmountMinor: ticketPriceMinor * quantity,
  currency,
  status:           'confirmed',
  placedAt:         new Date(),
  cancelledAt:      null,
});
