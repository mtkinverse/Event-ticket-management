import { AppError } from '../utils/errors.js';

export const authorize = (policyFn) => async (req, reply) => {
  if (!policyFn(req.user, req.params)) {
    throw new AppError('Forbidden', 403);
  }
};
