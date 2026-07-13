import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, GraduationCap, Clock, ClipboardList, User as UserIcon, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const hrTabs = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/internships', label: 'Interns', icon: GraduationCap },
  { to: '/attendance', label: 'Attendance', icon: Clock },
]

const selfTabs = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserIcon },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
]

export default function BottomNav({ onOpenSidebar }) {
  const { user } = useAuth()
  const location = useLocation()
  const isHR = user?.role === 'hr'
  const tabs = isHR ? hrTabs : selfTabs

  return (
    <nav className="bottom-nav" id="bottom-nav">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
      <button
        className={`bottom-nav-item ${![...tabs.map(t => t.to)].includes(location.pathname) ? 'active' : ''}`}
        onClick={onOpenSidebar}
        type="button"
      >
        <Menu />
        <span>More</span>
      </button>
    </nav>
  )
}
