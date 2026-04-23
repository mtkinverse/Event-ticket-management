import { v4 as uuidv4 } from 'uuid';
import { generateQR } from '../../utils/qr.js';

export const createTicket = async ({ bookingId, eventId, userId }) => {
  const id = uuidv4();
  const qrCode = await generateQR({ ticketId: id, eventId, userId });
  return {
    id,
    eventId,
    bookingId,
    userId,
    qrCode,
    status:   'valid',
    issuedAt: new Date(),
  };
};

export const createTickets = ({ bookingId, eventId, userId, quantity }) =>
  Promise.all(Array.from({ length: quantity }, () => createTicket({ bookingId, eventId, userId })));
