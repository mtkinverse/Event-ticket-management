import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Badge } from '../components/common/Badge.jsx';

const ROLE_VARIANT = { customer: 'info', organizer: 'warning', admin: 'danger' };

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="container" style={{ padding: '3rem 1rem', maxWidth: 560 }}>
      <h1 className="section__title" style={{ marginBottom: '2rem' }}>My Profile</h1>

      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700,
          }}>
            {user.initials}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{user.name}</h2>
            <div style={{ marginTop: 4 }}>
              <Badge label={user.role} variant={ROLE_VARIANT[user.role] ?? 'info'} />
            </div>
          </div>
        </div>

        <div className="profile__field">
          <span className="profile__label">Role</span>
          <span className="profile__value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
        </div>

        <div className="profile__field">
          <span className="profile__label">Email</span>
          <span className="profile__value">{user.email}</span>
        </div>

        {user.phone && (
          <div className="profile__field">
            <span className="profile__label">Phone</span>
            <span className="profile__value">{user.phone}</span>
          </div>
        )}

        {user.createdAt && (
          <div className="profile__field">
            <span className="profile__label">Member since</span>
            <span className="profile__value">
              {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Link to="/settings/notifications" className="btn btn--outline btn--sm">🔔 Notification preferences</Link>
      </div>

      <style>{`
        .profile__field { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
        .profile__field:last-child { border-bottom: none; }
        .profile__label { color: var(--text-muted); font-size: 0.875rem; }
        .profile__value { font-weight: 500; }
      `}</style>
    </main>
  );
}
