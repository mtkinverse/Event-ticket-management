import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { SpinnerPage } from '../components/common/Spinner.jsx';

export function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return <SpinnerPage />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
