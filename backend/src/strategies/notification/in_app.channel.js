import { AppError } from '../../utils/errors.js';

export const inAppChannel = {
  name: 'in_app',
  send: async () => {
    throw new AppError('In-app channel not implemented', 501);
  },
};
