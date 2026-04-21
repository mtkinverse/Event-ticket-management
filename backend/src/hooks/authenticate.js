import { AppError } from '../utils/errors.js';
import { userRepo } from '../repos/user.repo.js';

export async function authenticate(req, reply) {
  try {
    await req.jwtVerify();
  } catch {
    throw new AppError('Unauthorized', 401);
  }

  const user = await userRepo.findById(req.user.id);
  if (!user) throw new AppError('Unauthorized', 401);

  req.user = user;
}
