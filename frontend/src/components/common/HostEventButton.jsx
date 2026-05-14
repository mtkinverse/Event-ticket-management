import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole.js';

export function HostEventButton({ className = 'btn btn--primary', children = 'Host Event' }) {
  const { isLoggedIn, isOrganizer } = useRole();
  const to = !isLoggedIn  ? '/login'
           : !isOrganizer ? '/become-organizer'
           :                '/events/new';
  return <Link to={to} className={className}>{children}</Link>;
}
