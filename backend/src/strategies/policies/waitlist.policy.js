export const canJoinWaitlist = (user) => user.role === 'customer';

export const canLeaveWaitlist = (user) => user.role === 'customer';
