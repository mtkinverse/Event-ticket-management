import { v4 as uuidv4 } from 'uuid';

export const createEvent = ({
  title, description, category, location,
  startsAt, endsAt, capacity, ticketPrice,
  imageUrl = null, refundDeadline = null, organizerId,
}) => ({
  id: uuidv4(),
  organizerId,
  title,
  description,
  category,
  location,
  startsAt:         new Date(startsAt),
  endsAt:           new Date(endsAt),
  capacity,
  remaining:        capacity,
  ticketPrice,
  imageUrl,
  status:           'pending',
  refundDeadline:   refundDeadline ? new Date(refundDeadline) : null,
  rejectionReason:  null,
  registrationOpen: true,
});

export const createApplicationFee = ({ organizerId, eventId, amount, gatewayPaymentIntentId = null }) => ({
  id: uuidv4(),
  organizerId,
  eventId,
  amount,
  status:                 'held',
  gatewayPaymentIntentId,
  heldAt:                 new Date(),
  resolvedAt:             null,
});
