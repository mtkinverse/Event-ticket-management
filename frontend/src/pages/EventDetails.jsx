import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents.js';
import { useRole } from '../hooks/useRole.js';
import { EventCard } from '../components/common/EventCard.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

export default function EventDetails() {
  const { id } = useParams();
  const { event, related, loading, error } = useEvent(id);
  const { isLoggedIn } = useRole();
  const navigate = useNavigate();

  if (loading) return <SpinnerPage />;
  if (error || !event) return (
    <div className="page"><div className="container section"><div className="empty-state"><h3>Event not found</h3><Link to="/events" className="btn btn--primary mt-4">Browse Events</Link></div></div></div>
  );

  const handleBook = () => {
    if (!isLoggedIn) return navigate('/login');
    navigate(`/events/${id}/book`);
  };

  return (
    <div className="page">
      {/* Hero image */}
      <div style={{ height: 380, position: 'relative', background: 'var(--primary)', overflow: 'hidden', marginTop: 'var(--nav-height)' }}>
        <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(to top, rgba(15,27,61,0.9) 0%, transparent 60%)' }}>
          <div className="container" style={{ paddingBottom: 'var(--space-8)' }}>
            <Badge label={event.status} />
            <h1 style={{ color: '#fff', margin: 'var(--space-3) 0 var(--space-2)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>{event.title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>📍 {event.location}</p>
          </div>
        </div>
      </div>

      <div className="container section" style={{ paddingTop: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-8)', alignItems: 'start' }}>
          {/* Left: details */}
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>About this event</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: 'var(--space-8)' }}>{event.description}</p>

            {related.length > 0 && (
              <>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>Related Events</h3>
                <div className="grid-3">
                  {related.map(ev => <EventCard key={ev.id} event={ev} />)}
                </div>
              </>
            )}
          </div>

          {/* Right: booking card */}
          <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 'calc(var(--nav-height) + var(--space-6))' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</div>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--primary)', marginBottom: 'var(--space-4)' }}>{event.priceFormatted}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>📅 {event.date.full}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
              {event.isSoldOut ? '🔴 Sold Out' : event.isAlmostFull ? `🟡 Only ${event.remaining} left` : `🟢 ${event.remaining} spots available`}
            </div>
            {event.isSoldOut ? (
              <button className="btn btn--outline w-full" onClick={() => isLoggedIn ? null : navigate('/login')}>Join Waitlist</button>
            ) : event.status !== 'active' ? (
              <p className="text-muted text-center">Booking not available</p>
            ) : (
              <button className="btn btn--primary btn--lg w-full" onClick={handleBook}>Book Ticket</button>
            )}
            {!isLoggedIn && <p className="text-muted text-center mt-4" style={{ fontSize: 'var(--font-size-xs)' }}>Sign in required to book</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
