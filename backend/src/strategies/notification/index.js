import { emailChannel }  from './email.channel.js';
import { mockChannel }   from './mock.channel.js';
import { smsChannel }    from './sms.channel.js';
import { inAppChannel }  from './in_app.channel.js';
import { AppError }      from '../../utils/errors.js';

const REGISTRY = {
  email:  emailChannel,
  mock:   mockChannel,
  sms:    smsChannel,
  in_app: inAppChannel,
};

const pickName = () =>
  process.env.NOTIFICATION_CHANNEL
  ?? (process.env.NODE_ENV === 'test' ? 'mock' : null)
  ?? (process.env.SMTP_HOST ? 'email' : 'mock');

export const resolveChannel = () => {
  const name = pickName();
  const channel = REGISTRY[name];
  if (!channel) throw new AppError(`Unknown notification channel: ${name}`, 500);
  return channel;
};

// Re-exported for tests / direct inspection.
export { mockChannel };
