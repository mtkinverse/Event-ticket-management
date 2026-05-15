import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents.js';
import { useBookEvent } from '../hooks/useBooking.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';
import { QrTicket } from '../components/common/QrTicket.jsx';
import { formatMoney } from '../utils/currency.js';

export default function TicketBooking() {
  const { id } = useParams();
  const { event, loading } = useEvent(id);
  const { book, joinWaitlist, loading: booking } = useBookEvent();
  const notify = useNotify();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(null);

  if (loading) return <SpinnerPage />;
  if (!event) return null;

  const totalMinor     = (event.priceMinor ?? 0) * qty;
  const totalFormatted = formatMoney(totalMinor, event.currency);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const result = await book({ eventId: id, quantity: qty });
      setDone(result);
      notify.success('Booking confirmed!');
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleWaitlist = async () => {
    try {
      await joinWaitlist(id);
      notify.success(`You're #3 on the waitlist. We'll notify you when a spot opens.`);
      navigate(`/events/${id}`);
    } catch (err) {
      notify.error(err.message);
    }
  };

  if (done) return (
    <div className="page"><div className="container section" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>🎟️</div>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>You're In!</h2>
      <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>Your booking for <strong>{event.title}</strong> is confirmed. Save these QR tickets for entry.</p>
      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
          <div><div className="text-muted">Booking ID</div><strong>#{done.booking.id.slice(0, 8)}</strong></div>
          <div><div className="text-muted">Quantity</div><strong>{done.booking.quantity} ticket(s)</strong></div>
          <div><div className="text-muted">Total Paid</div><strong>{done.booking.totalFormatted}</strong></div>
          <div><div className="text-muted">Status</div><strong style={{ color: 'var(--success)' }}>Confirmed</strong></div>
        </div>
        <div className="qr-grid">
          {(done.booking.tickets ?? []).map(t => <QrTicket key={t.id} ticket={t} />)}
        </div>
      </div>
      <button className="btn btn--primary" onClick={() => navigate('/dashboard')}>View My Tickets</button>
    </div></div>
  );

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>Book Tickets</h1>
          <p className="text-muted">{event.title}</p>
        </div>
      </div>
      <div className="container section" style={{ maxWidth: 520 }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-alt)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{event.title}</div>
            <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>📅 {event.date.full} &nbsp; 📍 {event.location}</div>
          </div>

          {event.isSoldOut ? (
            <div className="text-center">
              <p style={{ marginBottom: 'var(--space-4)' }}>This event is sold out. Join the waitlist and we'll notify you if a spot opens.</p>
              <Button variant="outline" loading={booking} onClick={handleWaitlist}>Join Waitlist</Button>
            </div>
          ) : (
            <form onSubmit={handleBook}>
              <div className="form-group">
                <label className="form-label">Number of Tickets</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={event.remaining}
                  value={qty}
                  onChange={e => setQty(Math.max(1, Math.min(event.remaining, Number(e.target.value) || 1)))}
                />
                <small className="text-muted">{event.remaining} ticket(s) available</small>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4) 0', borderTop: '1px solid var(--border)', marginBottom: 'var(--space-6)' }}>
                <span className="text-muted">Total ({qty} × {event.priceFormatted})</span>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>{totalFormatted}</span>
              </div>
              <Button variant="primary" size="lg" loading={booking} className="w-full">Confirm & Pay</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
