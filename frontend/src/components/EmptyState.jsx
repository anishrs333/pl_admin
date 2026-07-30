import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', description, action, className = '' }) {
  return (
    <div className={`state-empty ${className}`}>
      <div className="state-empty-icon">
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="state-empty-title">{title}</h3>
      {description && <p className="state-empty-desc">{description}</p>}
      {action && <div className="state-empty-action">{action}</div>}
    </div>
  )
}
