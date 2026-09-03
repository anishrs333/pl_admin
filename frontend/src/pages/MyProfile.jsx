import { useQuery } from '@tanstack/react-query'
import { Mail, Phone, MapPin, Calendar, Building2, Briefcase, Shield, User } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import IDBadge from '../components/IDBadge'

export default function MyProfile() {
  const { user } = useAuth()
  const isHR = user?.role === 'hr'
  const isEmployee = user?.profile?.kind === 'employee'
  const isIntern = user?.profile?.kind === 'intern'

  const { data: employees, isLoading: empLoading } = useQuery({
    queryKey: ['my-employee'],
    queryFn: () => api.get('/employees/').then(r => r.data),
    enabled: isEmployee
  })
  const { data: interns, isLoading: intLoading } = useQuery({
    queryKey: ['my-intern'],
    queryFn: () => api.get('/internships/').then(r => r.data),
    enabled: isIntern
  })

  const Row = ({ icon: Icon, label, value, bg = 'var(--indigo-50)', color = 'var(--indigo)' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--slate)' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{value || '—'}</div>
      </div>
    </div>
  )

  if (isHR && !isEmployee && !isIntern) {
    const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'HR Admin'
    const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

    return (
      <div>
        <div className="page-header">
          <div><h2 className="page-header-title">My Profile</h2><p className="page-header-sub">Administrator Account</p></div>
        </div>

        <div className="card" style={{ background: 'var(--indigo-deep)', border: 'none', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#fff', flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600 }}>{displayName}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>HR Administrator</div>
            </div>
            <div className="id-badge" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.25)' }}>
              <span className="id-badge-label" style={{ color: 'rgba(255,255,255,0.6)' }}>ROLE</span>
              <span className="id-badge-code" style={{ color: '#fff' }}>HR ADMIN</span>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">Account details</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Row icon={User} label="Username" value={user?.username} />
              <Row icon={Mail} label="Email" value={user?.email} />
              <Row icon={Phone} label="Phone" value={user?.phone} bg="var(--green-50)" color="#047857" />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Permissions & status</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Row icon={Shield} label="Access Level" value="Full System Administration" bg="var(--amber-50)" color="#B45309" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={16} style={{ color: '#047857' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--slate)' }}>Status</div>
                  <span className="badge badge-green" style={{ marginTop: 2 }}>Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if ((isEmployee && empLoading) || (isIntern && intLoading)) {
    return <div className="loading-center"><div className="spinner" /></div>
  }

  const profile = isEmployee ? (employees?.results || employees || [])[0] : (interns?.results || interns || [])[0]
  if (!profile) return <div className="loading-center"><div className="spinner" /></div>

  const displayName = isEmployee ? profile.full_name : profile.name
  const initials = displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const picUrl = profile.profile_picture_url

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-header-title">My Profile</h2><p className="page-header-sub">Your personal record</p></div>
      </div>

      {/* Hero card */}
      <div className="card" style={{ background: 'var(--indigo-deep)', border: 'none', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#fff', flexWrap: 'wrap' }}>
          {picUrl
            ? <img src={picUrl} alt={displayName} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid rgba(255,255,255,0.3)' }} />
            : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                {initials}
              </div>
            )
          }
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
              {isEmployee ? (profile.designation_name || 'Employee') : `${profile.domain} Intern`}
            </div>
          </div>
          <div className="id-badge" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.25)' }}>
            <span className="id-badge-label" style={{ color: 'rgba(255,255,255,0.6)' }}>{isEmployee ? 'EMP ID' : 'INT ID'}</span>
            <span className="id-badge-code" style={{ color: '#fff' }}>{isEmployee ? profile.employee_id : profile.intern_id}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Contact information</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row icon={Mail} label="Email" value={profile.email} />
            <Row icon={Phone} label="Mobile" value={profile.mobile} bg="var(--green-50)" color="#047857" />
            {isEmployee
              ? profile.address && <Row icon={MapPin} label="Address" value={profile.address} bg="var(--amber-50)" color="#B45309" />
              : <Row icon={Building2} label="College" value={profile.college_name} bg="var(--amber-50)" color="#B45309" />
            }
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">{isEmployee ? 'Employment details' : 'Internship details'}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isEmployee ? (
              <>
                <Row icon={Building2} label="Department" value={profile.department_name} />
                <Row icon={Briefcase} label="Designation" value={profile.designation_name} bg="#EDE9FE" color="#5B21B6" />
                <Row icon={Calendar} label="Joining date" value={profile.joining_date} bg="var(--paper)" color="var(--slate)" />
              </>
            ) : (
              <>
                <Row icon={Briefcase} label="Domain" value={profile.domain} />
                <Row icon={Calendar} label="Duration" value={`${profile.start_date} → ${profile.end_date}`} bg="var(--paper)" color="var(--slate)" />
                {profile.description && <Row icon={User} label="About" value={profile.description} bg="var(--paper)" color="var(--slate)" />}
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={16} style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--slate)' }}>Status</div>
                <span className={`badge ${profile.status === 'active' ? 'badge-green' : 'badge-gray'}`} style={{ marginTop: 2 }}>{profile.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
