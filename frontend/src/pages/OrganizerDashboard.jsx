import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useOrganizerEvents } from '../hooks/useEvents.js';
import { Badge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

const ONBOARDED_KEY = 'eventhub.organizer.onboarded';

const STATS_FROM = (events) => ({
  total: events.length,
  active: events.filter(e => e.status === 'active').length,
  pending: events.filter(e => e.status === 'pending').length,
  ticketsSold: events.reduce((s, e) => s + (e.capacity - e.remaining), 0),
});

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { events, loading } = useOrganizerEvents();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (params.get('onboarded') === '1' && !localStorage.getItem(ONBOARDED_KEY)) {
      setShowTour(true);
    }
  }, [params]);

  const dismissTour = () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    setShowTour(false);
    // strip the query param so refresh doesn't re-trigger.
    params.delete('onboarded');
    setParams(params, { replace: true });
  };

  if (loading) return <SpinnerPage />;
  const stats = STATS_FROM(events);

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1>Organizer Dashboard</h1>
            <p className="text-muted">Manage your events</p>
          </div>
          <Link to="/events/new" className="btn btn--primary">+ New Event</Link>
        </div>
      </div>

      <div className="container section" style={{ paddingTop: 'var(--space-8)' }}>
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
          {[
            { label: 'Total Events', value: stats.total },
            { label: 'Active Events', value: stats.active },
            { label: 'Pending Review', value: stats.pending },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Events table */}
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Your Events</h3>
        {events.length === 0 ? (
          <div className="empty-state">
            <h3>No events yet</h3>
            <Link to="/events/new" className="btn btn--primary mt-4">Create your first event</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Capacity</th><th>Sold</th><th>Status</th><th /></tr></thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id}>
                    <td><strong>{ev.title}</strong></td>
                    <td>{ev.category}</td>
                    <td>{ev.date.full}</td>
                    <td>{ev.capacity}</td>
                    <td>{ev.capacity - ev.remaining}</td>
                    <td><Badge label={ev.status} /></td>
                    <td><Link to={`/events/${ev.id}`} className="btn btn--ghost btn--sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showTour}
        title="Welcome aboard, organizer! 🎉"
        onCancel={dismissTour}
        onConfirm={() => { dismissTour(); navigate('/events/new'); }}
        confirmLabel="Host my first event"
        cancelLabel="I'll explore first"
        confirmVariant="primary"
      >
        <p>Here's how to host your first event:</p>
        <ol style={{ paddingLeft: '1.25em', margin: 'var(--space-3) 0' }}>
          <li style={{ marginBottom: 'var(--space-2)' }}>Click <strong>Host my first event</strong> below to open the event form.</li>
          <li style={{ marginBottom: 'var(--space-2)' }}>Fill in the details — title, date, capacity. Paid events are coming soon; for now everything is free.</li>
          <li>Submit for admin approval. Once approved, your event goes live and attendees can book.</li>
        </ol>
        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
          You can always come back via the <strong>+ Host Event</strong> button in the nav.
        </p>
      </Modal>
    </div>
  );
}
