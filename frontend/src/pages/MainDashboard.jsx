import { Fragment, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useRole } from '../hooks/useRole.js';
import { useMyBookings } from '../hooks/useBooking.js';
import { Badge } from '../components/common/Badge.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';
import { QrTicket } from '../components/common/QrTicket.jsx';

export default function MainDashboard() {
  const { user } = useAuth();
  const { isOrganizer, isAdmin } = useRole();
  const { bookings, loading } = useMyBookings();
  const [expanded, setExpanded] = useState(null);

  if (isOrganizer) return <Navigate to="/organizer" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

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
              <thead><tr><th>Booking</th><th>Date</th><th>Qty</th><th>Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <Fragment key={b.id}>
                    <tr>
                      <td><strong>#{b.id.slice(0, 8)}</strong></td>
                      <td>{b.placedAtFormatted}</td>
                      <td>{b.quantity}</td>
                      <td>{b.totalFormatted}</td>
                      <td><Badge label={b.status} /></td>
                      <td>
                        {b.status === 'confirmed' && (b.tickets?.length > 0) && (
                          <button className="btn btn--ghost btn--sm" onClick={() => toggle(b.id)}>
                            {expanded === b.id ? 'Hide' : 'View Tickets'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === b.id && (
                      <tr>
                        <td colSpan={6} style={{ background: 'var(--bg-alt)', padding: 'var(--space-6)' }}>
                          <div className="qr-grid">
                            {b.tickets.map(t => <QrTicket key={t.id} ticket={t} />)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
