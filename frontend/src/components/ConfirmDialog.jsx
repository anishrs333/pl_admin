import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false, loading = false }) {
  return (
    <div className="state-confirm-overlay" onClick={onCancel}>
      <div className="state-confirm" onClick={e => e.stopPropagation()}>
        <div className={`state-confirm-icon ${danger ? 'state-confirm-icon-danger' : ''}`}>
          <AlertTriangle size={28} strokeWidth={1.5} />
        </div>
        <h3 className="state-confirm-title">{title}</h3>
        <p className="state-confirm-msg">{message}</p>
        <div className="state-confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
