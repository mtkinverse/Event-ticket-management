import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole.js';

export function HostEventButton({ className = 'btn btn--primary', children = 'Host Event', ...rest }) {
  const { isOrganizer } = useRole();
  const to = !isOrganizer ? '/become-organizer' : '/events/new';
  return <Link to={to} className={className} {...rest}>{children}</Link>;
}
