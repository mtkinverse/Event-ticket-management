export const canBook = (user) => user.role === 'customer';

export const canCancelBooking = (user, booking) =>
  user.role === 'admin' || (user.role === 'customer' && booking.userId === user.id);

export const canViewBooking = (user, booking) =>
  user.role === 'admin' || booking.userId === user.id;
