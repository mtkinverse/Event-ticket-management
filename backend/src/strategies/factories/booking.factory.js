import { v4 as uuidv4 } from 'uuid';

export const createBooking = ({ userId, eventId, quantity, ticketPrice }) => ({
  id:          uuidv4(),
  userId,
  eventId,
  quantity,
  totalAmount: Number(ticketPrice) * quantity,
  status:      'confirmed',
  placedAt:    new Date(),
});
