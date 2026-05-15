import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole.js';
import { useMyApplication } from '../hooks/useOrganizerApplication.js';
import { organizerApplicationsApi } from '../services/api/organizer_applications.js';
import { useNotify } from '../contexts/NotificationContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { SpinnerPage } from '../components/common/Spinner.jsx';
import { SUPPORTED_CURRENCIES, formatMoney, toMinor } from '../utils/currency.js';

// v1 platform-wide security fee (mirrors backend config.applicationFee).
// Kept here as a UI hint only; the backend is authoritative.
const FEE_HINT_AMOUNT   = 500000;
const FEE_HINT_CURRENCY = 'PKR';
const FEE_HINT_MAJOR    = 5000;

export default function BecomeOrganizer() {
  const notify = useNotify();
  const navigate = useNavigate();
  const { user, isCustomer, isOrganizer } = useRole();
  const { application, loading, refresh } = useMyApplication();
  const [form, setForm] = useState({
    businessName:     '',
    motivation:       '',
    paymentAmount:    '',
    currency:         'PKR',
    paymentReference: '',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reapplying, setReapplying] = useState(false);

  if (isOrganizer) return <Navigate to="/organizer" replace />;
  if (user && !isCustomer) return <Navigate to="/" replace />;
  if (loading) return <SpinnerPage />;

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return notify.error('Please attach a screenshot of your payment.');
    setSubmitting(true);
    try {
      await organizerApplicationsApi.submit({
        businessName:       form.businessName,
        motivation:         form.motivation,
        currency:           form.currency,
        paymentReference:   form.paymentReference,
        paymentAmountMinor: toMinor(form.paymentAmount, form.currency),
        snapshotFile:       file,
      });
      notify.success("Application submitted! We'll email you within 48 hours.");
      await refresh();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // If they've already applied, show status instead of the form —
  // except when they've chosen to re-apply after a rejection.
  if (application && !(reapplying && application.status === 'rejected')) {
    return (
      <div className="page">
        <div className="dashboard-header">
          <div className="container"><h1>Organizer Application</h1></div>
        </div>
        <div className="container section" style={{ maxWidth: 720 }}>
          <div className="card" style={{ padding: 'var(--space-8)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h3>{application.businessName}</h3>
              <Badge label={application.status} />
            </div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>Submitted {application.submittedAtFormatted}</p>
            {application.status === 'pending' && (
              <p>We've received your application. We'll email you within 48 hours with the decision.</p>
            )}
            {application.status === 'approved' && (
              <>
                <p style={{ marginBottom: 'var(--space-4)' }}>You're an organizer! Head over to the organizer dashboard to host your first event.</p>
                <Link to="/organizer?onboarded=1" className="btn btn--primary">Open organizer dashboard</Link>
              </>
            )}
            {application.status === 'rejected' && (
              <>
                <p><strong>Reason:</strong> {application.rejectionReason ?? 'No reason provided'}</p>
                <p className="text-muted mt-4" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
                  You can revise your details and submit a new application below.
                </p>
                <Button variant="primary" onClick={() => setReapplying(true)}>Re-apply</Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container">
          <h1>Apply to become an event organizer</h1>
          <p className="text-muted">Host free events on EventHub. Pay the security fee, upload your transfer screenshot, and we'll review within 48 hours.</p>
        </div>
      </div>
      <div className="container section" style={{ maxWidth: 720 }}>
        {reapplying && application?.status === 'rejected' && (
          <div className="card" style={{ padding: 'var(--space-4) var(--space-6)', marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--danger)', background: 'var(--bg-alt)' }}>
            <strong>Your previous application was rejected.</strong>
            <p className="text-muted" style={{ marginTop: 'var(--space-1)', marginBottom: 0, fontSize: 'var(--font-size-sm)' }}>
              Reason: {application.rejectionReason ?? 'No reason provided'}. Update your details below and submit again.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)' }}>Your business</h3>
            <div className="form-group">
              <label className="form-label">Business / organization name *</label>
              <input className="form-input" value={form.businessName} onChange={set('businessName')} required placeholder="e.g. NUCES Tech Society" />
            </div>
            <div className="form-group">
              <label className="form-label">Why do you want to host events on EventHub? *</label>
              <textarea className="form-input" rows={4} value={form.motivation} onChange={set('motivation')} required placeholder="A few sentences about what you'll host…" />
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Security fee</h3>
            <p className="text-muted" style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
              Transfer <strong>{formatMoney(FEE_HINT_AMOUNT, FEE_HINT_CURRENCY)}</strong> to our account, then upload the receipt below. The fee is fully refunded if your application is rejected.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Amount paid *</label>
                <input className="form-input" type="number" min="1" step="0.01" value={form.paymentAmount} onChange={set('paymentAmount')} required placeholder={String(FEE_HINT_MAJOR)} />
                <small className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Enter the amount in {form.currency} (e.g. {FEE_HINT_MAJOR.toLocaleString('en-US')}).</small>
              </div>
              <div className="form-group">
                <label className="form-label">Currency *</label>
                <select className="form-input form-select" value={form.currency} onChange={set('currency')}>
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction reference *</label>
              <input className="form-input" value={form.paymentReference} onChange={set('paymentReference')} required placeholder="e.g. TRX-12345 / IMG-9876" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment screenshot *</label>
              <input className="form-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
              <small className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>PNG / JPEG / WebP — up to 4 MB.</small>
            </div>
          </div>

          <div className="flex gap-4">
            {user ? (
              <>
                <Button variant="primary" size="lg" loading={submitting}>Submit application</Button>
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              </>
            ) : (
              <Link to="/login" className="btn btn--primary btn--lg">Sign in to apply</Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
