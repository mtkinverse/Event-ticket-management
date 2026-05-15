import { notificationPreferenceRepo } from '../repos/notification_preference.repo.js';
import { templates, MANDATORY_TYPES, NOTIFICATION_TYPES_BY_ROLE } from '../configs/templates.config.js';
import { AppError } from '../utils/errors.js';

const typesForRole = (role) => NOTIFICATION_TYPES_BY_ROLE[role] ?? [];

/**
 * Returns the preference matrix scoped to types the user's role can plausibly receive.
 */
export const meService = {
  async listPreferences(user) {
    const allowed = typesForRole(user.role);
    const rows = await notificationPreferenceRepo.findByUser(user.id);
    const byType = Object.fromEntries(rows.map(r => [r.type, r.muted]));
    return allowed.map(type => ({
      type,
      muted:     !!byType[type],
      mandatory: MANDATORY_TYPES.has(type),
    }));
  },

  async setPreference(user, type, muted) {
    if (!templates[type])                       throw new AppError(`Unknown notification type: ${type}`, 422);
    if (!typesForRole(user.role).includes(type)) {
      throw new AppError(`Notification type "${type}" is not available for your role`, 403);
    }
    if (MANDATORY_TYPES.has(type) && muted)     throw new AppError(`Cannot mute mandatory type: ${type}`, 422);

    const existing = await notificationPreferenceRepo.findOneByUserAndType(user.id, type);
    if (existing) {
      const [updated] = await notificationPreferenceRepo.updateBulk([existing.id], { muted });
      return updated;
    }
    return notificationPreferenceRepo.insert({ userId: user.id, type, muted });
  },
};
