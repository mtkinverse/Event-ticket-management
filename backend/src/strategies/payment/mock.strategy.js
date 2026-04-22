import { v4 as uuidv4 } from 'uuid';

export const mockPaymentStrategy = {
  charge({ amount, metadata }) {
    return Promise.resolve({
      gatewayPaymentIntentId: `mock-${uuidv4()}`,
      status: 'succeeded',
      paidAt: new Date(),
    });
  },

  refund({ gatewayPaymentIntentId, amount }) {
    return Promise.resolve({
      status: 'refunded',
      refundedAt: new Date(),
    });
  },
};
