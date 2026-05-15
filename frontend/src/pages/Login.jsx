import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Button } from '../components/common/Button.jsx';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = tab === 'login'
        ? await login({ email: form.email, password: form.password })
        : await register({ name: form.name, email: form.email, password: form.password });
      notify.success(`Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}!`);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'organizer' ? '/organizer' : '/');
    } catch (err) {
      notify.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Link to="/" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--primary)' }}>
            Event<span style={{ color: 'var(--accent)' }}>Hub</span>
          </Link>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' auth-tab--active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab${tab === 'register' ? ' auth-tab--active' : ''}`} onClick={() => setTab('register')}>Create Account</button>
        </div>
        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Jane Doe" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>
          {tab === 'register' && (
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
              Want to host events? Sign up as an attendee first, then apply to become an organizer from your dashboard.
            </p>
          )}
          <Button variant="primary" size="lg" loading={loading} className="w-full mt-4">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
