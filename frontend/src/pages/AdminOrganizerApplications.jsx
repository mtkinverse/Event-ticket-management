import { useState } from 'react';
import { usePendingApplications } from '../hooks/useOrganizerApplication.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';

export default function AdminOrganizerApplications() {
  const notify = useNotify();
  const { items, loading, approve, reject, pendingId } = usePendingApplications();
  const [pendingDecision, setPendingDecision] = useState(null); // { app, kind: 'approve' | 'reject' }
  const [rejectReason, setRejectReason] = useState('');
  const [viewing, setViewing] = useState(null); // application whose snapshot we're previewing

  if (loading) return <SpinnerPage />;

  const close = () => { setPendingDecision(null); setRejectReason(''); };

  const confirm = async () => {
    const { app, kind } = pendingDecision;
    try {
      if (kind === 'approve') {
        await approve(app.id);
        notify.success(`Approved ${app.businessName}.`);
      } else {
        if (!rejectReason.trim()) return notify.error('Reason is required.');
        await reject(app.id, rejectReason.trim());
        notify.success(`Rejected ${app.businessName}.`);
      }
      close();
    } catch (err) {
      notify.error(err.message);
    }
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>Organizer Applications</h1>
          <p className="text-muted">{items.length} pending review</p>
        </div>
      </div>
      <div className="container section">
        {items.length === 0 ? (
          <div className="empty-state"><h3>No pending applications</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Snapshot</th>
                  <th>Business</th>
                  <th>Payment</th>
                  <th>Reference</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id}>
                    <td>
                      {a.paymentSnapshotUrl && (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setViewing(a)}
                          style={{ padding: 0, border: 'none', background: 'none' }}
                          title="View full snapshot"
                        >
                          <img
                            src={a.paymentSnapshotUrl}
                            alt="payment proof"
                            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                          />
                        </button>
                      )}
                    </td>
                    <td>
                      <div><strong>{a.businessName}</strong></div>
                      <div className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>{a.motivation.slice(0, 80)}{a.motivation.length > 80 ? '…' : ''}</div>
                    </td>
                    <td>{a.paymentFormatted}</td>
                    <td><code style={{ fontSize: 'var(--font-size-xs)' }}>{a.paymentReference}</code></td>
                    <td>{a.submittedAtFormatted}</td>
                    <td><Badge label={a.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={pendingId === a.id}
                          onClick={() => setPendingDecision({ app: a, kind: 'approve' })}
                        >Approve</button>
                        <button
                          className="btn btn--danger btn--sm"
                          disabled={pendingId === a.id}
                          onClick={() => setPendingDecision({ app: a, kind: 'reject' })}
                        >Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot preview modal */}
      <Modal
        open={!!viewing}
        title={viewing?.businessName}
        onCancel={() => setViewing(null)}
        onConfirm={() => setViewing(null)}
        confirmLabel="Close"
        cancelLabel="—"
      >
        {viewing && (
          <img src={viewing.paymentSnapshotUrl} alt="payment proof" style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius)' }} />
        )}
      </Modal>

      {/* Approve / Reject confirm */}
      <Modal
        open={!!pendingDecision}
        title={pendingDecision?.kind === 'approve' ? 'Approve this organizer?' : 'Reject this application?'}
        onCancel={close}
        onConfirm={confirm}
        confirmLabel={pendingDecision?.kind === 'approve' ? 'Approve' : 'Reject'}
        confirmVariant={pendingDecision?.kind === 'approve' ? 'primary' : 'danger'}
        loading={pendingId === pendingDecision?.app?.id}
      >
        {pendingDecision && (
          <>
            <p><strong>{pendingDecision.app.businessName}</strong></p>
            <p className="text-muted">{pendingDecision.app.paymentFormatted} · {pendingDecision.app.paymentReference}</p>
            {pendingDecision.kind === 'reject' && (
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Reason (sent to applicant) *</label>
                <textarea className="form-input" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Payment proof does not match the security-fee amount." />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
