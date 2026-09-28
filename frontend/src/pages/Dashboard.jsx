import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts'
import { 
  Users, GraduationCap, UserSearch, Clock, ClipboardList, 
  DollarSign, CheckCircle2, Calendar, Award, Search, UserCheck, 
  ChevronRight, TrendingUp, BarChart3, PieChart as PieIcon, Activity
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6']

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
      sub: 'Click to view employee names & IDs ➔',
      icon: Users,
      color: '#4F46E5',
      bg: '#EEF2FF',
    },
    {
      id: 'active_interns',
      label: 'Active Interns',
      value: stats?.total_interns ?? '—',
      sub: 'Click to view active intern details ➔',
      icon: GraduationCap,
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      id: 'completed_interns',
      label: 'Completed Interns',
      value: stats?.completed_interns_count ?? '—',
      sub: 'Click to view completed intern list ➔',
      icon: Award,
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      id: 'emp_present',
      label: 'Employees Present Today',
      value: stats?.today_attendance_employees ?? '—',
      sub: 'Click to view present employees ➔',
      icon: UserCheck,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      id: 'intern_present',
      label: 'Interns Present Today',
      value: stats?.today_attendance_interns ?? '—',
      sub: 'Click to view present interns ➔',
      icon: UserCheck,
      color: '#059669',
      bg: '#ECFDF5',
    },
  ]

  const secondaryCards = [
    { label: 'Open Candidates', value: stats?.total_candidates ?? '—', icon: UserSearch, color: '#D97706', bg: '#FFFBEB', route: '/candidates' },
    { label: 'Pending Leaves', value: stats?.pending_leaves ?? '—', icon: Calendar, color: '#DC2626', bg: '#FEF2F2', route: '/attendance' },
    { label: 'Pending Tasks', value: stats?.pending_tasks ?? '—', icon: ClipboardList, color: '#DC2626', bg: '#FEF2F2', route: '/tasks' },
    { label: 'Payroll Pending', value: stats?.pending_payroll ?? '—', icon: DollarSign, color: '#D97706', bg: '#FFFBEB', route: '/payroll' },
  ]

  const totalWorkforce = (stats?.total_employees || 0) + (stats?.total_interns || 0)
  const totalPresentToday = stats?.today_attendance || 0
  const attendancePercentage = totalWorkforce > 0 ? Math.round((totalPresentToday / totalWorkforce) * 100) : 0

  return (
    <div>
      {/* Premium Hero Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #2563EB 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#FFFFFF',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(37,99,235,0.15)',
        }}
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 100, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Activity size={14} style={{ color: '#60A5FA' }} /> Executive HR Control Console
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Good to see you, HR
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, maxWidth: 540, lineHeight: 1.5 }}>
              Real-time organization analytics, workforce breakdown, and interactive attendance rosters.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: 2 }}>Overall Attendance</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6 }}>
                {attendancePercentage}% <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>({totalPresentToday} present)</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: 2 }}>Total Active Workforce</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                {totalWorkforce} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>people</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Category Cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} style={{ color: 'var(--indigo)' }} /> Workforce Roster Breakdown
        </h3>
        <span style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 500 }}>Click cards to open searchable roster</span>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {mainCards.map(({ id, label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={id}
            className="stat-card"
            onClick={() => openModal(id)}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              border: '1px solid var(--border)',
              position: 'relative',
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="stat-icon-wrap" style={{ background: bg, width: 42, height: 42, borderRadius: 12 }}><Icon style={{ color }} size={21} /></div>
              <ChevronRight size={18} style={{ color: 'var(--slate)', opacity: 0.5 }} />
            </div>
            <div className="stat-label" style={{ marginTop: 10, fontSize: 13, color: 'var(--slate)' }}>{label}</div>
            <div className="stat-value" style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
            <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Data Visualization Charts Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} style={{ color: 'var(--indigo)' }} /> Analytics & Visual Insights
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* Chart 1: 7-Day Attendance Trend */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={16} style={{ color: '#4F46E5' }} /> 7-Day Attendance Trend
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate)' }}>Daily presence turnout over the last 7 days</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.attendance_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--slate)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--slate)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', color: '#FFF', borderRadius: 8, fontSize: 12, border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Employees" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEmp)" />
                <Area type="monotone" dataKey="Interns" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Roster Breakdown */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={16} style={{ color: '#2563EB' }} /> Department Roster
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate)' }}>Active employee headcount by department</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.department_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--slate)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--slate)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', color: '#FFF', borderRadius: 8, fontSize: 12, border: 'none' }} />
                <Bar dataKey="Employees" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Internship Domain Distribution */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={16} style={{ color: '#059669' }} /> Internship Domains
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate)' }}>Active vs completed interns by domain</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.domain_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--slate)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--slate)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', color: '#FFF', borderRadius: 8, fontSize: 12, border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Active" fill="#059669" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Completed" fill="#D97706" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Task Execution Status */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PieIcon size={16} style={{ color: '#8B5CF6' }} /> Task Progress Status
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate)' }}>Overview of task workflow status</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.task_status || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(stats?.task_status || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', color: '#FFF', borderRadius: 8, fontSize: 12, border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Operations Quick Overview Cards */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--ink)' }}>Operations Quick Access</h3>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {secondaryCards.map(({ label, value, icon: Icon, color, bg, route }) => (
          <div
            key={label}
            className="stat-card"
            onClick={() => route && navigate(route)}
            style={{ cursor: route ? 'pointer' : 'default', borderRadius: 14 }}
          >
            <div className="stat-icon-wrap" style={{ background: bg, width: 40, height: 40, borderRadius: 10 }}><Icon style={{ color }} size={20} /></div>
            <div className="stat-label" style={{ marginTop: 8 }}>{label}</div>
            <div className="stat-value" style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
          </div>
        ))}
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
