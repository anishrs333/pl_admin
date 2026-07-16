import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import NotificationBell from './NotificationBell'
import { NotifProvider } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useAuth()
  const initials = ((user?.first_name?.[0] || user?.username?.[0] || 'U') + (user?.last_name?.[0] || '')).toUpperCase()

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width <= 1024)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  return (
    <NotifProvider>
      <div className="app-shell">
        {/* Desktop & Tablet top header — notification bell + user */}
        <header className="top-header">
          {isTablet && (
            <button className="tablet-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
          )}
          <div style={{ flex: 1 }} />
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

        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isTablet && !sidebarOpen}
        />

        <main className="main-area">
          <div className="page-body">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation bar */}
        {isMobile && <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />}
      </div>
    </NotifProvider>
  )
}
