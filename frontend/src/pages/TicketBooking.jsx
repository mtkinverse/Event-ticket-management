import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents.js';
import { useBookEvent } from '../hooks/useBooking.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

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

  const total = (event.price * qty).toFixed(2);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const result = await book({ eventId: id, quantity: qty });
      setDone(result);
      notify.success('Booking confirmed! Check your email for the QR ticket.');
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
    <div className="page"><div className="container section" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>🎟️</div>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>You're In!</h2>
      <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>Your booking for <strong>{done.event.title}</strong> is confirmed. A QR ticket has been sent to your email.</p>
      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
          <div><div className="text-muted">Booking ID</div><strong>{done.booking.id}</strong></div>
          <div><div className="text-muted">Quantity</div><strong>{done.booking.quantity} ticket(s)</strong></div>
          <div><div className="text-muted">Total Paid</div><strong>{done.booking.totalFormatted}</strong></div>
          <div><div className="text-muted">Status</div><strong style={{ color: 'var(--success)' }}>Confirmed</strong></div>
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
                <select className="form-input form-select" value={qty} onChange={e => setQty(Number(e.target.value))}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4) 0', borderTop: '1px solid var(--border)', marginBottom: 'var(--space-6)' }}>
                <span className="text-muted">Total ({qty} × {event.priceFormatted})</span>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>${total}</span>
              </div>
              <Button variant="primary" size="lg" loading={booking} className="w-full">Confirm & Pay</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
