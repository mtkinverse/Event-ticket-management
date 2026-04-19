import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '../hooks/useRole.js';

export function RoleGuard({ allow }) {
  const { role, isLoggedIn } = useRole();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
