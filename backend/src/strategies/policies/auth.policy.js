export const canAccessProfile = (user, params) =>
  user.id === params.id || user.role === 'admin';
