import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

export default function Topbar({ title }) {
  const { user } = useAuth()
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NotificationBell />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{user?.first_name} {user?.last_name}</div>
      </div>
    </div>
  )
}
