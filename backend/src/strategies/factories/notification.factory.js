import { v4 as uuidv4 } from 'uuid';

export const createNotification = ({ userId, type, channel, subject }) => ({
  id:      uuidv4(),
  userId,
  type,
  channel,
  status:  'pending',
  subject,
});
