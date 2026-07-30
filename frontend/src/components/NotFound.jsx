import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="state-error">
      <div className="state-error-icon">
        <MapPin size={48} strokeWidth={1.5} />
      </div>
      <h3 className="state-error-title">Page Not Found</h3>
      <p className="state-error-desc">The page you're looking for doesn't exist or has been moved.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
    </div>
  )
}
