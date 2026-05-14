import { notificationRepo }            from '../repos/notification.repo.js';
import { notificationPreferenceRepo }  from '../repos/notification_preference.repo.js';
import { createNotification }          from '../strategies/factories/notification.factory.js';
import { resolveChannel }              from '../strategies/notification/index.js';
import { populateTemplate }            from '../utils/template.js';
import { MANDATORY_TYPES }             from '../configs/templates.config.js';

export const notificationService = {
  async notify({ user, type, payload }) {
    try {
      if (!user || !user.id || !user.email) return null;

      // CR-B: per-user mute, with MANDATORY_TYPES exempt from suppression.
      if (!MANDATORY_TYPES.has(type) && await notificationPreferenceRepo.isMuted(user.id, type)) {
        return null;
      }

      const channel = resolveChannel();
      const message = populateTemplate(type, { user, ...payload });

      const row   = createNotification({ userId: user.id, type, channel: channel.name, subject: message.subject });
      const saved = await notificationRepo.insert(row);

      try {
        const result = await channel.send({ to: user.email, ...message });
        await notificationRepo.updateById(saved.id, {
          status:     'sent',
          providerId: result.providerId ?? null,
          sentAt:     new Date(),
        });
        return saved.id;
      } catch (sendErr) {
        await notificationRepo.updateById(saved.id, {
          status:       'failed',
          errorMessage: sendErr.message,
        });
        console.error(`[notify] ${type} send failed for user ${user.id}:`, sendErr.message);
        return saved.id;
      }
    } catch (err) {
      console.error(`[notify] ${type} failed pre-send for user ${user?.id}:`, err.message);
      return null;
    }
  },
};
