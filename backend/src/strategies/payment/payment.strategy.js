/**
 * Payment strategy contract. All strategies must implement:
 *
 * charge({ amount, metadata }) → { gatewayPaymentIntentId, status, paidAt }
 * refund({ gatewayPaymentIntentId, amount }) → { status, refundedAt }
 */
