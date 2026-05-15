import { Link } from 'react-router-dom';
import { useFeaturedEvents } from '../hooks/useEvents.js';
import { EventCard } from '../components/common/EventCard.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';
import { HostEventButton } from '../components/common/HostEventButton.jsx';

const CATEGORIES = ['Technology', 'Music', 'Business', 'Design', 'Health', 'Arts'];

export default function Home() {
  const { events, loading } = useFeaturedEvents();

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <div className="hero__eyebrow">Discover What's On Near You</div>
            <h1 className="hero__title">Find Events That Inspire You</h1>
            <p className="hero__subtitle">From tech summits to jazz nights — book your next unforgettable experience.</p>
            <div className="hero__actions">
              <Link to="/events" className="btn btn--primary btn--lg">Browse All Events</Link>
              <HostEventButton className="btn btn--outline btn--lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Host an Event</HostEventButton>
            </div>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="section--alt" style={{ padding: 'var(--space-6) 0' }}>
        <div className="container">
          <div className="filter-bar">
            {CATEGORIES.map(cat => (
              <Link key={cat} to={`/events?category=${cat}`} className="filter-chip">{cat}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured events */}
      <section className="section">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="section-title">Featured Events</h2>
              <p className="section-subtitle">Handpicked experiences you won't want to miss</p>
            </div>
            <Link to="/events" className="btn btn--outline">View All</Link>
          </div>
          {loading ? <SpinnerPage /> : (
            <div className="grid-3">
              {events.map(ev => <EventCard key={ev.id} event={ev} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA banner */}
      <section className="section" style={{ background: 'var(--primary)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: 'var(--space-4)' }}>Have an Upcoming Event?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 'var(--space-8)', fontSize: 'var(--font-size-lg)' }}>
            Reach thousands of attendees. Submit your event and start selling tickets today.
          </p>
          <HostEventButton className="btn btn--primary btn--lg">Register Your Event</HostEventButton>
        </div>
      </section>
    </div>
  );
}
