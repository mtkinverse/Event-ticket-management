import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useRole } from '../hooks/useRole.js';
import { useMyBookings } from '../hooks/useBooking.js';
import { Badge } from '../components/common/Badge.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

export default function MainDashboard() {
  const { user } = useAuth();
  const { isOrganizer, isAdmin } = useRole();
  const { bookings, loading } = useMyBookings();

  if (isOrganizer) return <Link to="/organizer" replace />;
  if (isAdmin) return <Link to="/admin" replace />;

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>My Tickets</h1>
          <p className="text-muted">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
      </div>
      <div className="container section" style={{ paddingTop: 'var(--space-8)' }}>
        {loading ? <SpinnerPage /> : bookings.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings yet</h3>
            <p>Browse events and book your first experience.</p>
            <Link to="/events" className="btn btn--primary mt-4">Browse Events</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Event</th><th>Date</th><th>Qty</th><th>Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.event?.title ?? '—'}</strong></td>
                    <td>{b.event?.date?.full ?? '—'}</td>
                    <td>{b.quantity}</td>
                    <td>{b.totalFormatted}</td>
                    <td><Badge label={b.status} /></td>
                    <td>{b.event && <Link to={`/events/${b.event.id}`} className="btn btn--ghost btn--sm">View</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
