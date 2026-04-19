import { Link } from 'react-router-dom';
import { useEvents, usePendingEvents } from '../hooks/useEvents.js';
import { Badge } from '../components/common/Badge.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

export default function AdminDashboard() {
  const { events: active, loading: loadingActive } = useEvents({ status: 'active' });
  const { events: pending, loading: loadingPending } = usePendingEvents();

  if (loadingActive || loadingPending) return <SpinnerPage />;

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>Admin Dashboard</h1>
          <p className="text-muted">Platform overview</p>
        </div>
      </div>
      <div className="container section" style={{ paddingTop: 'var(--space-8)' }}>
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
          {[
            { label: 'Active Events', value: active.length, accent: false },
            { label: 'Pending Review', value: pending.length, accent: true },
            { label: 'Total Capacity', value: active.reduce((s, e) => s + e.capacity, 0) },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__value" style={s.accent ? { color: 'var(--warning)' } : {}}>{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending queue shortcut */}
        {pending.length > 0 && (
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)', background: '#FFF7ED', borderColor: 'var(--warning)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⏳ {pending.length} event(s) awaiting approval</div>
                <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Review and approve or reject pending event submissions.</div>
              </div>
              <Link to="/admin/approvals" className="btn btn--primary">Review Now</Link>
            </div>
          </div>
        )}

        {/* Active events table */}
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Active Events</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Remaining</th><th>Status</th><th /></tr></thead>
            <tbody>
              {active.map(ev => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong></td>
                  <td>{ev.category}</td>
                  <td>{ev.date.full}</td>
                  <td>{ev.remaining} / {ev.capacity}</td>
                  <td><Badge label={ev.status} /></td>
                  <td><Link to={`/events/${ev.id}`} className="btn btn--ghost btn--sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
