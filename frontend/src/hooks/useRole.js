import { useAuth } from './useAuth.js';

export const useRole = () => {
  const { user } = useAuth();
  return {
    user,
    role: user?.role ?? null,
    isCustomer:  user?.role === 'customer',
    isOrganizer: user?.role === 'organizer',
    isAdmin:     user?.role === 'admin',
    isLoggedIn:  !!user,
    can: (roles) => !!user && roles.includes(user.role),
  };
};
