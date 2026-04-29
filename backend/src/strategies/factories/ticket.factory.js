import { v4 as uuidv4 } from 'uuid';
import { qr } from '../../utils/qr.js';

const shortNumber = () => uuidv4().split('-')[0].toUpperCase();

export const createTickets = async ({ bookingId, eventId, quantity }) => {
  const tickets = [];
  for (let i = 0; i < quantity; i++) {
    const ticketNumber = `TKT-${shortNumber()}`;
    const qrCode = await qr.generate(ticketNumber);
    tickets.push({
      id: uuidv4(),
      bookingId,
      eventId,
      ticketNumber,
      qrCode,
      scannedAt: null,
    });
  }
  return tickets;
};
