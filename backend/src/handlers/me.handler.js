import { meService } from '../services/me.service.js';

export const meHandler = {
  async listPreferences(req, reply) {
    const preferences = await meService.listPreferences(req.user.id);
    reply.send({ preferences });
  },

  async setPreference(req, reply) {
    await meService.setPreference(req.user.id, req.params.type, !!req.body.muted);
    reply.send({ ok: true });
  },
};
