import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, Users, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [roleMode, setRoleMode] = useState('admin') // 'admin' | 'employee' | 'intern'
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { login, logout } = useAuth()
  const navigate = useNavigate()

  const handleTabChange = (mode) => {
    setRoleMode(mode)
    setForm({ username: '', password: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const resData = await login(form.username.trim(), form.password)
      
      const role = resData.role
      const kind = resData.profile?.kind

      const isAdmin = role === 'hr' || role === 'hr_executive' || role === 'superuser'
      const isEmployee = (kind === 'employee' || role === 'employee') && !isAdmin
      const isIntern = (kind === 'intern' || role === 'intern') && !isAdmin

      if (roleMode === 'admin' && !isAdmin) {
        await logout()
        toast.error('Access Denied: Only Admin / HR users can log in via the Admin Portal.')
        setLoading(false)
        return
      }

      if (roleMode === 'employee' && !isEmployee) {
        await logout()
        toast.error('Access Denied: Only Employees can log in via the Employee Portal.')
        setLoading(false)
        return
      }

      if (roleMode === 'intern' && !isIntern) {
        await logout()
        toast.error('Access Denied: Only Interns can log in via the Intern Portal.')
        setLoading(false)
        return
      }

      toast.success(`Signed in successfully as ${resData.full_name || form.username}`)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid credentials. Please check and try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const portalMeta = {
    admin: {
      title: 'Admin & HR Portal',
      subtitle: 'Sign in with your HR Administrator credentials.',
      label: 'Admin Username / HR ID',
      placeholder: 'e.g. admin or HR-001',
      badgeBg: 'var(--indigo-50)',
      badgeColor: 'var(--indigo)',
      icon: Shield,
    },
    employee: {
      title: 'Employee Portal',
      subtitle: 'Sign in with your assigned Employee ID.',
      label: 'Employee ID / Username',
      placeholder: 'e.g. EMP-PL-001',
      badgeBg: 'var(--green-50)',
      badgeColor: '#15803D',
      icon: Users,
    },
    intern: {
      title: 'Intern Portal',
      subtitle: 'Sign in with your assigned Intern ID.',
      label: 'Intern ID / Username',
      placeholder: 'e.g. INT-PL-001',
      badgeBg: 'var(--amber-50)',
      badgeColor: '#B45309',
      icon: GraduationCap,
    }
  }

  const currentMeta = portalMeta[roleMode]
  const ActiveIcon = currentMeta.icon

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Left Branding Side - hidden on mobile */}
      <div style={{
        flex: 1, 
        background: 'var(--navy)', 
        color: '#fff',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '60px 10%',
        position: 'relative',
        overflow: 'hidden'
      }} className="login-sidebar">
        {/* Abstract Background Element */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'var(--primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(100px)' }} />
        
        <div style={{ zIndex: 1, maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
              PL
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>PL Soft Tech</div>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Enterprise HR & Operations Portal
          </h1>
          <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.6, marginBottom: 40 }}>
            Streamline workforce management with dedicated role-based portals for Admins, Employees, and Interns.
          </p>
          
          <div style={{ display: 'flex', gap: 32, opacity: 0.8 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Role Isolation</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Strict Portal Security</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>256-bit</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Encryption</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24,
        background: 'var(--surface)'
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          
          {/* Mobile brand header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, justifyContent: 'center' }} className="mobile-only-brand">
            <div className="auth-brand-mark" style={{ width: 40, height: 40, fontSize: 16 }}>PL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>PL Soft Tech</div>
          </div>

          {/* Portal Switcher Tabs */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 6, 
            background: 'var(--paper)', 
            padding: 4, 
            borderRadius: 12, 
            marginBottom: 28,
            border: '1px solid var(--border)'
          }}>
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 8px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: roleMode === 'admin' ? 'var(--surface)' : 'transparent',
                color: roleMode === 'admin' ? 'var(--indigo)' : 'var(--slate)',
                boxShadow: roleMode === 'admin' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Shield size={14} /> Admin
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('employee')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 8px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: roleMode === 'employee' ? 'var(--surface)' : 'transparent',
                color: roleMode === 'employee' ? '#15803D' : 'var(--slate)',
                boxShadow: roleMode === 'employee' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={14} /> Employee
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('intern')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 8px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: roleMode === 'intern' ? 'var(--surface)' : 'transparent',
                color: roleMode === 'intern' ? '#B45309' : 'var(--slate)',
                boxShadow: roleMode === 'intern' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <GraduationCap size={14} /> Intern
            </button>
          </div>

          {/* Active Portal Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '4px 10px', 
              borderRadius: 99, 
              background: currentMeta.badgeBg, 
              color: currentMeta.badgeColor,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 10
            }}>
              <ActiveIcon size={14} />
              {currentMeta.title}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
              Sign In
            </h2>
            <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>
              {currentMeta.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>{currentMeta.label}</label>
              <input
                className="form-control"
                style={{ padding: '12px 16px', fontSize: 15 }}
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder={currentMeta.placeholder}
                required
                autoFocus
                autoCapitalize="off"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  style={{ padding: '12px 16px', paddingRight: 42, fontSize: 15 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 0, display: 'flex' }}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, justifyContent: 'center' }} 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Verifying Portal Access…' : <>Sign in to {roleMode === 'admin' ? 'Admin Console' : roleMode === 'employee' ? 'Employee Portal' : 'Intern Portal'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: 'var(--slate)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>Portal Access Restricted.</strong> Each portal accepts only its designated user role. Users attempting to log in via an unauthorized portal will be blocked.
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html:`
        .mobile-only-brand { display: none !important; }
        @media (max-width: 768px) {
          .login-sidebar { display: none !important; }
          .mobile-only-brand { display: flex !important; }
        }
      `}} />
    </div>
  )
}
