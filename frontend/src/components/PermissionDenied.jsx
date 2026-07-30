import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PermissionDenied() {
  const navigate = useNavigate()
  return (
    <div className="state-error">
      <div className="state-error-icon">
        <ShieldOff size={48} strokeWidth={1.5} />
      </div>
      <h3 className="state-error-title">Access Denied</h3>
      <p className="state-error-desc">You don't have permission to view this page.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
    </div>
  )
}
