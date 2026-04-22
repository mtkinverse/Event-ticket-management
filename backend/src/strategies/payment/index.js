import { mockPaymentStrategy } from './mock.strategy.js';
import { AppError } from '../../utils/errors.js';

const REGISTRY = {
  mock: mockPaymentStrategy,
  // stripe: stripeStrategy  ← added in Phase 4
};

export const resolvePaymentStrategy = (name) => {
  const strategy = REGISTRY[name];
  if (!strategy) throw new AppError(`Unknown payment strategy: ${name}`, 500);
  return strategy;
};
