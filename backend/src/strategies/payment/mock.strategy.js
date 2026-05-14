import { v4 as uuidv4 } from 'uuid';

// In-memory history so tests can inspect what was charged.
const history = [];

export const mockPaymentStrategy = {
  name: 'mock',
  charge({ amountMinor, currency, metadata }) {
    const intent = {
      gatewayPaymentIntentId: `mock-${uuidv4()}`,
      status: 'succeeded',
      amountMinor,
      currency,
      metadata,
      paidAt: new Date(),
    };
    history.push({ kind: 'charge', ...intent });
    return Promise.resolve(intent);
  },

  refund({ gatewayPaymentIntentId, amountMinor }) {
    const refund = { gatewayPaymentIntentId, amountMinor, status: 'refunded', refundedAt: new Date() };
    history.push({ kind: 'refund', ...refund });
    return Promise.resolve(refund);
  },

  // Test helpers — kept on the strategy itself for ergonomic mocking.
  history,
  clear: () => { history.length = 0; },
  last:  () => history[history.length - 1] ?? null,
  count: (predicate) => predicate ? history.filter(predicate).length : history.length,
};
