import { AppError } from '../../utils/errors.js';

export const smsChannel = {
  name: 'sms',
  send: async () => {
    throw new AppError('SMS channel not implemented', 501);
  },
};
