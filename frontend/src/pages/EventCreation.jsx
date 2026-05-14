import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../services/api/events.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { SUPPORTED_CURRENCIES } from '../utils/currency.js';

const CATEGORIES = ['Technology', 'Music', 'Business', 'Design', 'Health', 'Arts', 'Sports', 'Food', 'Other'];

const INIT = {
  title: '', description: '', category: '', location: '',
  startsAt: '', endsAt: '', capacity: '',
  ticketPriceMinor: 0, currency: 'PKR',
  meetingUrl: '', imageUrl: '', refundDeadline: '',
};

const helperTag = (text) => (
  <small style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
    💡 {text}
  </small>
);

export default function EventCreation() {
  const notify = useNotify();
  const navigate = useNavigate();
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        title:            form.title,
        description:      form.description,
        category:         form.category,
        location:         form.location,
        startsAt:         form.startsAt,
        endsAt:           form.endsAt,
        capacity:         Number(form.capacity),
        ticketPriceMinor: 0,                       // v1 free-events lock
        currency:         form.currency,
        ...(form.meetingUrl ? { meetingUrl: form.meetingUrl } : {}),
        ...(form.imageUrl   ? { imageUrl:   form.imageUrl   } : {}),
        // refundDeadline stays optional in v1 (the field is disabled below)
      };
      await eventsApi.create(data);
      notify.success("Event submitted for review! We'll notify you once approved.");
      navigate('/organizer');
    } catch (err) {
      notify.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>Create New Event</h1>
          <p className="text-muted">Fill in the details — your event will be reviewed before going live.</p>
        </div>
      </div>
      <div className="container section" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)' }}>Event Details</h3>
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input className="form-input" placeholder="e.g. Tech Summit 2026" value={form.title} onChange={set('title')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-input" rows={4} placeholder="Describe what attendees can expect…" value={form.description} onChange={set('description')} required style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input form-select" value={form.category} onChange={set('category')} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-input" placeholder="Venue, City" value={form.location} onChange={set('location')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date & Time *</label>
                <input className="form-input" type="datetime-local" value={form.startsAt} onChange={set('startsAt')} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time *</label>
                <input className="form-input" type="datetime-local" value={form.endsAt} onChange={set('endsAt')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity *</label>
                <input className="form-input" type="number" min="1" placeholder="100" value={form.capacity} onChange={set('capacity')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input form-select" value={form.currency} onChange={set('currency')}>
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Ticket Price</label>
                <input className="form-input" type="number" value={0} disabled />
                {helperTag('Paid events are coming soon. All v1 events are free.')}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Online Meeting Link</label>
              <input className="form-input" type="url" placeholder="https://meet.google.com/… or https://zoom.us/…" value={form.meetingUrl} onChange={set('meetingUrl')} />
              {helperTag('Optional — paste a Zoom / Google Meet / Teams link. Attendees see it after booking.')}
            </div>
            <div className="form-group">
              <label className="form-label">Cover Image URL</label>
              <input className="form-input" type="url" placeholder="https://…" value={form.imageUrl} onChange={set('imageUrl')} />
            </div>
            <div className="form-group">
              <label className="form-label">Refund Deadline</label>
              <input className="form-input" type="datetime-local" value={form.refundDeadline} onChange={set('refundDeadline')} disabled />
              {helperTag('Activates with paid events. Free-event cancellations are always allowed.')}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', background: 'var(--bg-alt)' }}>
            <h4 style={{ marginBottom: 'var(--space-2)' }}>Application Fee</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Already paid when your organizer application was approved — no extra charge per event.</p>
          </div>

          <div className="flex gap-4">
            <Button variant="primary" size="lg" loading={loading}>Submit for Review</Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
