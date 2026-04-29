import { v4 as uuidv4 } from 'uuid';

export const createWaitlistEntry = ({ userId, eventId }) => ({
  id:            uuidv4(),
  userId,
  eventId,
  status:        'waiting',
  holdExpiresAt: null,
  joinedAt:      new Date(),
});
