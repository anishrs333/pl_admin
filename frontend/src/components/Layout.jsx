import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { NotifProvider } from '../context/NotificationContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <NotifProvider>
      <div className="app-shell">
        <div className="mobile-header">
          <div className="mobile-brand">PL Soft Tech</div>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
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
      </div>
    </NotifProvider>
  )
}
