import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePendingEvents } from '../hooks/useEvents.js';
import { eventsApi } from '../services/api/events.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

export default function AdminApproval() {
  const { events, loading, reload } = usePendingEvents();
  const notify = useNotify();
  const [acting, setActing] = useState(null);

  const handle = (id, action) => async () => {
    setActing(id + action);
    try {
      if (action === 'approve') {
        await eventsApi.approve(id);
        notify.success('Event approved and is now live.');
      } else {
        await eventsApi.reject(id);
        notify.info('Event rejected. The organizer will be notified.');
      }
      await reload();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>Event Approvals</h1>
          <p className="text-muted">{loading ? '…' : `${events.length} event(s) awaiting review`}</p>
        </div>
      </div>
      <div className="container section" style={{ paddingTop: 'var(--space-8)' }}>
        {loading ? <SpinnerPage /> : events.length === 0 ? (
          <div className="empty-state"><h3>All clear!</h3><p>No events awaiting approval.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {events.map(ev => (
              <div key={ev.id} className="card" style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 'var(--space-4)', alignItems: 'start' }}>
                  <img src={ev.imageUrl} alt={ev.title} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{ev.title}</div>
                    <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                      {ev.category} &nbsp;·&nbsp; 📍 {ev.location} &nbsp;·&nbsp; 📅 {ev.date.full}
                    </div>
                    <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                      Capacity: {ev.capacity} &nbsp;·&nbsp; Price: {ev.priceFormatted}
                    </div>
                  </div>
                  <div className="flex gap-2" style={{ flexDirection: 'column' }}>
                    <Button variant="primary" size="sm" loading={acting === ev.id + 'approve'} onClick={handle(ev.id, 'approve')}>Approve</Button>
                    <Button variant="ghost" size="sm" loading={acting === ev.id + 'reject'} onClick={handle(ev.id, 'reject')}>Reject</Button>
                    <Link to={`/events/${ev.id}`} className="btn btn--ghost btn--sm">Preview</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
