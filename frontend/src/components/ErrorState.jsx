import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorState({ title = 'Something went wrong', description, onRetry, className = '' }) {
  return (
    <div className={`state-error ${className}`}>
      <div className="state-error-icon">
        <AlertTriangle size={40} strokeWidth={1.5} />
      </div>
      <h3 className="state-error-title">{title}</h3>
      {description && <p className="state-error-desc">{description}</p>}
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  )
}
