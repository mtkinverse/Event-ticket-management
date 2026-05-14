import { notificationPreferenceRepo } from '../repos/notification_preference.repo.js';
import { templates, MANDATORY_TYPES } from '../configs/templates.config.js';
import { AppError } from '../utils/errors.js';

/**
 * Returns the full preference matrix for a user: one row per known template type,
 * with `muted` flag and `mandatory` flag (mandatory rows cannot be muted).
 */
export const meService = {
  async listPreferences(userId) {
    const rows = await notificationPreferenceRepo.findByUser(userId);
    const byType = Object.fromEntries(rows.map(r => [r.type, r.muted]));
    return Object.keys(templates).map(type => ({
      type,
      muted:     !!byType[type],
      mandatory: MANDATORY_TYPES.has(type),
    }));
  },

  async setPreference(userId, type, muted) {
    if (!templates[type])         throw new AppError(`Unknown notification type: ${type}`, 422);
    if (MANDATORY_TYPES.has(type) && muted) {
      throw new AppError(`Cannot mute mandatory type: ${type}`, 422);
    }

    const existing = await notificationPreferenceRepo.findOneByUserAndType(userId, type);
    if (existing) {
      const [updated] = await notificationPreferenceRepo.updateBulk([existing.id], { muted });
      return updated;
    }
    return notificationPreferenceRepo.insert({ userId, type, muted });
  },
};
