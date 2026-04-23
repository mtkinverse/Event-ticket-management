export const canBook = (user, event) =>
  user.role === 'customer' && event.status === 'active' && event.registrationOpen;

export const canCancelBooking = (user, booking) =>
  booking.userId === user.id && booking.status === 'confirmed';

export const canJoinWaitlist = (user, event) =>
  user.role === 'customer' && event.status === 'active' && event.remaining === 0;
