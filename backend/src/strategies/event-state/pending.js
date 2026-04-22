export const pendingState = {
  approve: () => ({ status: 'active' }),
  reject:  () => ({ status: 'cancelled' }),
};
