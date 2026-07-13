import { useState } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import NotificationBell from './NotificationBell'
import { NotifProvider } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const initials = ((user?.first_name?.[0] || user?.username?.[0] || 'U') + (user?.last_name?.[0] || '')).toUpperCase()

  return (
    <NotifProvider>
      <div className="app-shell">
        {/* Desktop top header — notification bell + user */}
        <header className="top-header">
          <NotificationBell />
          <div className="top-header-user">
            <span>{user?.first_name} {user?.last_name}</span>
            <div className="user-avatar-sm">{initials}</div>
          </div>
        </header>

        {/* Mobile header — brand + notification bell */}
        <div className="mobile-header">
          <div className="mobile-brand">PL Soft Tech</div>
          <div className="mobile-header-actions">
            <NotificationBell />
          </div>
        </div>
        
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="main-area">
          <div className="page-body">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation bar */}
        <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </NotifProvider>
  )
}
