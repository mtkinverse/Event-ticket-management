import { usePreferences } from '../hooks/usePreferences.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

const LABELS = {
  'booking.confirmed':                 { title: 'Booking confirmed',           group: 'Bookings' },
  'booking.cancelled':                 { title: 'Booking cancelled',           group: 'Bookings' },
  'waitlist.joined':                   { title: 'Joined a waitlist',           group: 'Waitlist' },
  'waitlist.promoted':                 { title: 'Promoted off the waitlist',   group: 'Waitlist' },
  'event.approved':                    { title: 'Your event was approved',    group: 'Organizer' },
  'event.rejected':                    { title: 'Your event was rejected',    group: 'Organizer' },
  'organizer.application.submitted':   { title: 'Application received',        group: 'Account' },
  'organizer.application.approved':    { title: 'Application approved',        group: 'Account' },
  'organizer.application.rejected':    { title: 'Application not approved',    group: 'Account' },
};

export default function NotificationSettings() {
  const notify = useNotify();
  const { preferences, loading, setMuted, savingType } = usePreferences();

  if (loading) return <SpinnerPage />;

  const grouped = preferences.reduce((acc, p) => {
    const label = LABELS[p.type] ?? { title: p.type, group: 'Other' };
    (acc[label.group] ||= []).push({ ...p, label: label.title });
    return acc;
  }, {});

  const onToggle = async (type, currentlyMuted) => {
    try {
      await setMuted(type, !currentlyMuted);
      notify.success(currentlyMuted ? 'Email enabled.' : 'Email muted.');
    } catch (err) {
      notify.error(err.message);
    }
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>Notification settings</h1>
          <p className="text-muted">Choose which emails EventHub sends you. Account-critical messages can't be muted.</p>
        </div>
      </div>
      <div className="container section" style={{ maxWidth: 720 }}>
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>{group}</h3>
            {items.map(p => (
              <div key={p.type} className="flex items-center justify-between" style={{ padding: 'var(--space-3) 0', borderTop: '1px solid var(--border)' }}>
                <div>
                  <div><strong>{p.label}</strong></div>
                  <small className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {p.mandatory ? 'Always sent — required for account use.' : (p.muted ? 'Currently muted.' : 'Currently enabled.')}
                  </small>
                </div>
                <button
                  className={`btn btn--sm ${p.mandatory ? 'btn--ghost' : (p.muted ? 'btn--outline' : 'btn--primary')}`}
                  disabled={p.mandatory || savingType === p.type}
                  onClick={() => onToggle(p.type, p.muted)}
                  title={p.mandatory ? 'Account-critical — cannot be muted' : undefined}
                >
                  {p.mandatory ? '🔒 Locked' : (savingType === p.type ? '…' : (p.muted ? 'Enable' : 'Mute'))}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
