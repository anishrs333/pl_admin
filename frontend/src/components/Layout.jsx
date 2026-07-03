import Sidebar from './Sidebar'
import { NotifProvider } from '../context/NotificationContext'

export default function Layout({ children }) {
  return (
    <NotifProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-area">
          <div className="page-body">
            {children}
          </div>
        </main>
      </div>
    </NotifProvider>
  )
}
