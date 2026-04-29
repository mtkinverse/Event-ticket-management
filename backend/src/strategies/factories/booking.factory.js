import { v4 as uuidv4 } from 'uuid';

export const createBooking = ({ userId, eventId, quantity, ticketPrice }) => ({
  id:          uuidv4(),
  userId,
  eventId,
  quantity,
  totalAmount: Number((Number(ticketPrice) * quantity).toFixed(2)),
  status:      'confirmed',
  placedAt:    new Date(),
  cancelledAt: null,
});
