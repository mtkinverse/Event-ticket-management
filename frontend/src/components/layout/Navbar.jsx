import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useRole } from '../../hooks/useRole.js';
import { HostEventButton } from '../common/HostEventButton.jsx';

const NAV_LINKS = {
  customer:  [{ to: '/events', label: 'Browse Events' }, { to: '/dashboard', label: 'My Tickets' }],
  organizer: [{ to: '/events', label: 'Browse Events' }, { to: '/organizer', label: 'My Events' }],
  admin:     [
    { to: '/events',                       label: 'Events' },
    { to: '/admin',                        label: 'Dashboard' },
    { to: '/admin/approvals',              label: 'Approvals' },
    { to: '/admin/organizer-applications', label: 'Organizers' },
  ],
};

export function Navbar() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const links = (role && NAV_LINKS[role]) || [];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">Event<span>Hub</span></Link>
        <div className="navbar__links">
          <NavLink to="/" end className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>Home</NavLink>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>{l.label}</NavLink>
          ))}
        </div>
        <div className="navbar__actions">
          {user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} style={{ fontSize: '0.8rem' }}>{user.initials}</NavLink>
              {role !== 'admin' && <HostEventButton className="btn btn--primary btn--sm">+ Host Event</HostEventButton>}
              <button className="btn btn--ghost btn--sm" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)' }} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn btn--primary btn--sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
