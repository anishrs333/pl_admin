import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Clock, GraduationCap, UserSearch, ClipboardList, DollarSign, Building2, Briefcase, LogOut, User as UserIcon, KeyRound, Home } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

const hrNav = [
  { section: 'Console', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/internships', label: 'Interns', icon: GraduationCap },
    { to: '/candidates', label: 'Candidates', icon: UserSearch },
  ]},
  { section: 'Operations', items: [
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/wfh', label: 'Work From Home', icon: Home },
    { to: '/tasks', label: 'Tasks', icon: ClipboardList },
    { to: '/payroll', label: 'Payroll', icon: DollarSign },
    { to: '/colleges', label: 'Colleges', icon: Building2 },
    { to: '/clients', label: 'Clients', icon: Briefcase },
  ]},
  { section: 'Account', items: [
    { to: '/security', label: 'Security', icon: KeyRound },
  ]},
]

const selfNav = [
  { section: 'My Workspace', items: [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/profile', label: 'My Profile', icon: UserIcon },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/wfh', label: 'Work From Home', icon: Home },
    { to: '/tasks', label: 'My Tasks', icon: ClipboardList },
    { to: '/payroll', label: 'My Payslips', icon: DollarSign },
  ]},
  { section: 'Account', items: [
    { to: '/security', label: 'Security', icon: KeyRound },
  ]},
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const isHR = user?.role === 'hr'
  const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U') + (user?.last_name?.[0] || '')
  const nav = isHR ? hrNav : selfNav
  const code = user?.profile?.code

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div>
          <div className="brand-mark">PL Soft Tech</div>
          <div className="brand-sub">{isHR ? 'HR Console' : 'Self-Service Portal'}</div>
        </div>
        {isOpen && (
          <button className="mobile-close-btn" onClick={onClose}>
            &times;
          </button>
        )}
      </div>
      <nav className="sidebar-nav">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-avatar">{initials.toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{user?.first_name} {user?.last_name}</div>
          <div className="user-role">{code || (isHR ? 'HR Administrator' : user?.role)}</div>
        </div>
        <NotificationBell />
        <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '4px' }} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
