import { Fragment, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useRole } from '../hooks/useRole.js';
import { useMyBookings } from '../hooks/useBooking.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';
import { QrTicket } from '../components/common/QrTicket.jsx';
import { Modal } from '../components/common/Modal.jsx';

const refundState = (event) => {
  if (!event?.refundDeadline) return { kind: 'none' };
  const deadline = new Date(event.refundDeadline);
  const formatted = deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return Date.now() < deadline.getTime()
    ? { kind: 'open', formatted }
    : { kind: 'closed', formatted };
};

export default function MainDashboard() {
  const { user } = useAuth();
  const { isOrganizer, isAdmin } = useRole();
  const { bookings, loading, cancel, cancellingId } = useMyBookings();
  const notify = useNotify();
  const [expanded, setExpanded] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);

  if (isOrganizer) return <Navigate to="/organizer" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const confirmCancel = async () => {
    const booking = pendingCancel;
    if (!booking) return;
    try {
      await cancel(booking.id);
      setPendingCancel(null);
      notify.success(`Booking for "${booking.event?.title ?? 'event'}" cancelled.`);
    } catch (err) {
      setPendingCancel(null);
      notify.error(err.message);
    }
  };

  const refundForPending = pendingCancel ? refundState(pendingCancel.event) : null;

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
              <thead><tr><th>Event</th><th>Booked</th><th>Qty</th><th>Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {bookings.map(b => {
                  const refund = refundState(b.event);
                  const isConfirmed = b.status === 'confirmed';
                  const canCancel = isConfirmed && refund.kind !== 'closed';
                  return (
                    <Fragment key={b.id}>
                      <tr>
                        <td>
                          {b.event ? (
                            <>
                              <strong>{b.event.title}</strong>
                              <div className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                                📅 {b.event.startsAtFormatted} · 📍 {b.event.location}
                              </div>
                            </>
                          ) : (
                            <strong>Booking #{b.id.slice(0, 8)}</strong>
                          )}
                          {isConfirmed && refund.kind === 'closed' && (
                            <div className="text-muted" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--danger)' }}>
                              Refund window closed
                            </div>
                          )}
                        </td>
                        <td>{b.placedAtFormatted}</td>
                        <td>{b.quantity}</td>
                        <td>{b.totalFormatted}</td>
                        <td><Badge label={b.status} /></td>
                        <td>
                          <div className="flex gap-2">
                            {isConfirmed && (b.tickets?.length > 0) && (
                              <button className="btn btn--ghost btn--sm" onClick={() => toggle(b.id)}>
                                {expanded === b.id ? 'Hide' : 'View Tickets'}
                              </button>
                            )}
                            {isConfirmed && (
                              <button
                                className="btn btn--danger btn--sm"
                                onClick={() => setPendingCancel(b)}
                                disabled={!canCancel || cancellingId === b.id}
                                title={!canCancel ? 'Refund window has closed' : undefined}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!pendingCancel}
        title="Cancel this booking?"
        onCancel={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
        confirmLabel="Yes, cancel"
        confirmVariant="danger"
        loading={cancellingId === pendingCancel?.id}
      >
        {pendingCancel && (
          <>
            <p><strong>{pendingCancel.event?.title ?? 'Booking'}</strong></p>
            <p className="text-muted">{pendingCancel.quantity} ticket{pendingCancel.quantity > 1 ? 's' : ''} · {pendingCancel.totalFormatted}</p>
            {refundForPending?.kind === 'open' && (
              <p>Cancelling now will refund your tickets. Refund window closes <strong>{refundForPending.formatted}</strong>.</p>
            )}
            {refundForPending?.kind === 'none' && (
              <p>This will release your tickets back to availability.</p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
