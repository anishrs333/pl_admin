import { CheckCircle } from 'lucide-react'

export default function SuccessState({ icon: Icon = CheckCircle, title, description, action, className = '' }) {
  return (
    <div className={`state-success ${className}`}>
      <div className="state-success-icon">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="state-success-title">{title}</h3>
      {description && <p className="state-success-desc">{description}</p>}
      {action && <div className="state-success-action">{action}</div>}
    </div>
  )
}
