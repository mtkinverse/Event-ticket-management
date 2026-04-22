export const canCreateEvent = (user) => user.role === 'organizer';

export const canApproveEvent = (user) => user.role === 'admin';

export const canEditEvent = (user, event) =>
  user.role === 'organizer' && event.organizerId === user.id;

export const canCancelEvent = (user, event) =>
  (user.role === 'organizer' && event.organizerId === user.id) || user.role === 'admin';
