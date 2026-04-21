import { authHandler } from '../handlers/auth.handler.js';
import { authenticate } from '../hooks/authenticate.js';
import { registerBody, loginBody } from '../schemas/auth.schema.js';

export async function authRoutes(app) {
  app.post('/register', { schema: { body: registerBody } }, authHandler.register);
  app.post('/login',    { schema: { body: loginBody } },    authHandler.login);
  app.get('/profile',  { preHandler: authenticate },        authHandler.profile);
}
