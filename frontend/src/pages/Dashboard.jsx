import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, UserSearch, Clock, ClipboardList, Building2, DollarSign, CheckCircle2, Calendar } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function HRDashboard() {
  const { data: stats } = useQuery({ queryKey:['dashboard-stats'], queryFn: () => api.get('/reports/dashboard/').then(r=>r.data) })

  const cards = [
    { label:'Active Employees', value: stats?.total_employees ?? '—', icon: Users, color:'var(--indigo)', bg:'var(--indigo-50)' },
    { label:'Active Interns', value: stats?.total_interns ?? '—', icon: GraduationCap, color:'#047857', bg:'var(--green-50)' },
    { label:'Open Candidates', value: stats?.total_candidates ?? '—', icon: UserSearch, color:'#B45309', bg:'var(--amber-50)' },
    { label:"Present Today", value: stats?.today_attendance ?? '—', icon: Clock, color:'var(--indigo)', bg:'var(--indigo-50)' },
    { label:'Pending Leave Requests', value: stats?.pending_leaves ?? '—', icon: Calendar, color:'var(--red)', bg:'var(--red-50)' },
    { label:'Pending Tasks', value: stats?.pending_tasks ?? '—', icon: ClipboardList, color:'var(--red)', bg:'var(--red-50)' },
    { label:'Payroll Pending', value: stats?.pending_payroll ?? '—', icon: DollarSign, color:'#B45309', bg:'var(--amber-50)' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Good to see you, HR</h2>
          <p className="page-header-sub">Full console — everything in one view</p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map(({label,value,icon:Icon,color,bg}) => (
          <div key={label} className="stat-card">
            <div className="stat-icon-wrap" style={{background:bg}}><Icon style={{color}} size={19}/></div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Quick reference</span></div>
        <div style={{fontSize:13,color:'var(--slate)',lineHeight:1.7}}>
          Employee and intern accounts are provisioned automatically — when you add a record, a login is created
          with the generated ID as username and their mobile number as the initial password. They'll see only
          their own profile, attendance, tasks and payslips.
        </div>
      </div>
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
  return user?.role === 'hr' ? <HRDashboard/> : <SelfDashboard/>
}
