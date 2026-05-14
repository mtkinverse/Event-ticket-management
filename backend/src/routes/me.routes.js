import { meHandler } from '../handlers/me.handler.js';
import { authenticate } from '../hooks/authenticate.js';

const setPreferenceBody = {
  type: 'object',
  required: ['muted'],
  properties: { muted: { type: 'boolean' } },
  additionalProperties: false,
};

export async function meRoutes(app) {
  app.get('/preferences',       { preHandler: authenticate }, meHandler.listPreferences);
  app.put('/preferences/:type', { preHandler: authenticate, schema: { body: setPreferenceBody } }, meHandler.setPreference);
}
