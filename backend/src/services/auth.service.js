import { userRepo } from '../repos/user.repo.js';
import { createUser } from '../strategies/factories/user.factory.js';
import { compare } from '../utils/hashing.js';
import { AppError } from '../utils/errors.js';

export const authService = {
  async register(data) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw new AppError('Email already in use', 409);

    const record = await createUser(data);
    return userRepo.insert(record);
  },

  async login({ email, password }) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    return user;
  },

  async getProfile(id) {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};
