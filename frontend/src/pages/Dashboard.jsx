import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Users, GraduationCap, UserSearch, Clock, ClipboardList, 
  DollarSign, CheckCircle2, Calendar, Award, Search, UserCheck, ChevronRight
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

function HRDashboard() {
  const navigate = useNavigate()
  const { data: stats } = useQuery({ 
    queryKey: ['dashboard-stats'], 
    queryFn: () => api.get('/reports/dashboard/').then(r => r.data) 
  })

  const [activeModal, setActiveModal] = useState(null) // 'active_employees' | 'active_interns' | 'completed_interns' | 'emp_present' | 'intern_present'
  const [modalSearch, setModalSearch] = useState('')

  const openModal = (type) => {
    setModalSearch('')
    setActiveModal(type)
  }

  const getModalData = () => {
    if (!stats) return { title: '', list: [], rawCount: 0, targetRoute: '' }
    let list = []
    let title = ''
    let targetRoute = ''

    if (activeModal === 'active_employees') {
      title = 'Active Employees Roster'
      list = stats.active_employees_list || []
      targetRoute = '/employees'
    } else if (activeModal === 'active_interns') {
      title = 'Active Interns List'
      list = stats.active_interns_list || []
      targetRoute = '/internships'
    } else if (activeModal === 'completed_interns') {
      title = 'Completed Interns Roster'
      list = stats.completed_interns_list || []
      targetRoute = '/internships'
    } else if (activeModal === 'emp_present') {
      title = 'Employees Present Today'
      list = stats.employees_present_today_list || []
      targetRoute = '/attendance'
    } else if (activeModal === 'intern_present') {
      title = 'Interns Present Today'
      list = stats.interns_present_today_list || []
      targetRoute = '/attendance'
    }

    const filtered = list.filter(item => {
      const q = modalSearch.toLowerCase().trim()
      if (!q) return true
      return (
        item.name?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q) ||
        item.dept?.toLowerCase().includes(q) ||
        item.domain?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q)
      )
    })

    return { title, list: filtered, rawCount: list.length, targetRoute }
  }

  const modalInfo = getModalData()

  const mainCards = [
    {
      id: 'active_employees',
      label: 'Active Employees',
      value: stats?.total_employees ?? '—',
      sub: 'Click to view employee names & IDs',
      icon: Users,
      color: 'var(--indigo)',
      bg: 'var(--indigo-50)',
    },
    {
      id: 'active_interns',
      label: 'Active Interns',
      value: stats?.total_interns ?? '—',
      sub: 'Click to view active intern details',
      icon: GraduationCap,
      color: '#047857',
      bg: 'var(--green-50)',
    },
    {
      id: 'completed_interns',
      label: 'Completed Interns',
      value: stats?.completed_interns_count ?? '—',
      sub: 'Click to view completed intern list',
      icon: Award,
      color: '#B45309',
      bg: 'var(--amber-50)',
    },
    {
      id: 'emp_present',
      label: 'Employees Present Today',
      value: stats?.today_attendance_employees ?? '—',
      sub: 'Click to view present employees',
      icon: UserCheck,
      color: 'var(--indigo)',
      bg: 'var(--indigo-50)',
    },
    {
      id: 'intern_present',
      label: 'Interns Present Today',
      value: stats?.today_attendance_interns ?? '—',
      sub: 'Click to view present interns',
      icon: UserCheck,
      color: '#047857',
      bg: 'var(--green-50)',
    },
  ]

  const secondaryCards = [
    { label: 'Open Candidates', value: stats?.total_candidates ?? '—', icon: UserSearch, color: '#B45309', bg: 'var(--amber-50)', route: '/candidates' },
    { label: 'Pending Leaves', value: stats?.pending_leaves ?? '—', icon: Calendar, color: 'var(--red)', bg: 'var(--red-50)', route: '/attendance' },
    { label: 'Pending Tasks', value: stats?.pending_tasks ?? '—', icon: ClipboardList, color: 'var(--red)', bg: 'var(--red-50)', route: '/tasks' },
    { label: 'Payroll Pending', value: stats?.pending_payroll ?? '—', icon: DollarSign, color: '#B45309', bg: 'var(--amber-50)', route: '/payroll' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Good to see you, HR</h2>
          <p className="page-header-sub">Interactive management dashboard — click cards to view detailed rosters</p>
        </div>
      </div>

      {/* Main Interactive Category Cards */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>Workforce Breakdown</h3>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {mainCards.map(({ id, label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={id}
            className="stat-card"
            onClick={() => openModal(id)}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid var(--border)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="stat-icon-wrap" style={{ background: bg }}><Icon style={{ color }} size={20} /></div>
              <ChevronRight size={16} style={{ color: 'var(--slate)', opacity: 0.6 }} />
            </div>
            <div className="stat-label" style={{ marginTop: 8 }}>{label}</div>
            <div className="stat-value" style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
            <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Operations Quick Overview Cards */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>Operations Overview</h3>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {secondaryCards.map(({ label, value, icon: Icon, color, bg, route }) => (
          <div
            key={label}
            className="stat-card"
            onClick={() => route && navigate(route)}
            style={{ cursor: route ? 'pointer' : 'default' }}
          >
            <div className="stat-icon-wrap" style={{ background: bg }}><Icon style={{ color }} size={19} /></div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Quick Reference Box */}
      <div className="card">
        <div className="card-header"><span className="card-title">Quick reference</span></div>
        <div style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.7 }}>
          Click on any Workforce Breakdown card above (Active Employees, Active Interns, Completed Interns, Present Employees, Present Interns) to inspect the complete list of names and ID numbers.
        </div>
      </div>

      {/* Interactive Detail Modal */}
      {activeModal && (
        <Modal
          title={`${modalInfo.title} (${modalInfo.rawCount})`}
          onClose={() => setActiveModal(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--slate)' }}>Showing {modalInfo.list.length} of {modalInfo.rawCount} entries</span>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveModal(null)
                  if (modalInfo.targetRoute) navigate(modalInfo.targetRoute)
                }}
              >
                Go to full page <ChevronRight size={14} />
              </button>
            </div>
          }
        >
          {/* Modal Search Input */}
          <div className="search-wrap" style={{ position: 'relative', marginBottom: 16 }}>
            <Search className="search-icon" size={16} />
            <input
              className="form-control"
              style={{ paddingLeft: 36, fontSize: 14 }}
              placeholder="Search by name, ID (e.g. EMP-PL-001), or department…"
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* List Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
            {modalInfo.list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--slate)', fontSize: 13 }}>
                No matching records found.
              </div>
            ) : (
              modalInfo.list.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--paper)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--indigo-50)',
                        color: 'var(--indigo)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 15,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--border)'
                      }}
                    >
                      {item.pic ? <img src={item.pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.name?.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                        <span className="badge badge-indigo" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '1px 6px' }}>
                          {item.code}
                        </span>
                        {item.dept && <span style={{ color: 'var(--slate)' }}>• {item.dept}</span>}
                        {item.domain && <span style={{ color: 'var(--slate)' }}>• {item.domain}</span>}
                      </div>
                    </div>
                  </div>

                  {item.check_in && (
                    <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600, background: '#DCFCE7', padding: '3px 10px', borderRadius: 99, flexShrink: 0 }}>
                      In: {item.check_in}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function SelfDashboard() {
  const { user } = useAuth()
  const { data } = useQuery({ queryKey:['my-dashboard'], queryFn: () => api.get('/reports/my-dashboard/').then(r=>r.data) })
  const code = user?.profile?.code
  const isIntern = user?.profile?.kind === 'intern'

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Welcome, {user?.first_name}</h2>
          <p className="page-header-sub">{isIntern ? 'Intern' : 'Employee'} self-service overview</p>
        </div>
      </div>

      <div className="card" style={{marginBottom:20, background:'linear-gradient(135deg, #111827 0%, #1E293B 50%, #2563EB 100%)', border:'none', padding:'28px 32px', position:'relative', overflow:'hidden'}}>
        {/* Decorative circle */}
        <div style={{position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(37,99,235,0.15)'}} />
        <div style={{position:'absolute', bottom:-30, right:60, width:100, height:100, borderRadius:'50%', background:'rgba(37,99,235,0.1)'}} />
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14, position:'relative', zIndex:1}}>
          <div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,marginBottom:8}}>Your Identity</div>
            <div style={{fontSize:28,fontWeight:800,color:'#FFFFFF',letterSpacing:'0.02em',marginBottom:4}}>{code}</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',fontWeight:500}}>{user?.first_name} {user?.last_name} · {isIntern ? 'Intern' : 'Employee'}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 16px', border:'1px solid rgba(255,255,255,0.15)'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700,marginBottom:2}}>Today</div>
              <div style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>{new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{background:'var(--red-50)'}}><ClipboardList style={{color:'var(--red)'}} size={19}/></div>
          <div className="stat-label">Pending Tasks</div>
          <div className="stat-value">{data?.pending_tasks ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{background:'var(--green-50)'}}><CheckCircle2 style={{color:'#047857'}} size={19}/></div>
          <div className="stat-label">Checked In Today</div>
          <div className="stat-value">{data?.attendance_today ? 'Yes' : 'No'}</div>
        </div>
        {isIntern && (
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{background:'var(--amber-50)'}}><GraduationCap style={{color:'#B45309'}} size={19}/></div>
            <div className="stat-label">Certificate</div>
            <div className="stat-value" style={{fontSize:16}}>{data?.certificate_issued ? 'Issued' : 'Pending'}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const isHRorTL = user?.role === 'hr' || user?.role === 'hr_executive'
  return isHRorTL ? <HRDashboard/> : <SelfDashboard/>
}
