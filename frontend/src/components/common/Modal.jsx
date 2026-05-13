import { useEffect } from 'react';

export function Modal({
  open,
  title,
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => !loading && onCancel?.()}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        {title && <h3 className="modal-panel__title">{title}</h3>}
        <div className="modal-panel__body">{children}</div>
        <div className="modal-panel__actions">
          <button className="btn btn--ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className={`btn btn--${confirmVariant}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
