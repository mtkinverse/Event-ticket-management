import { authService } from '../services/auth.service.js';
import { config } from '../configs/index.js';

const shapeUser = ({ passwordHash, updatedAt, ...user }) => user;

export const authHandler = {
  async register(req, reply) {
    const user = await authService.register(req.body);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: config.jwtExpiresIn });
    reply.code(201).send({ user: shapeUser(user), token });
  },

  async login(req, reply) {
    const user = await authService.login(req.body);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: config.jwtExpiresIn });
    reply.send({ user: shapeUser(user), token });
  },

  async profile(req, reply) {
    const user = await authService.getProfile(req.user.id);
    reply.send({ user: shapeUser(user) });
  },
};
