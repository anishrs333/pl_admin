import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShieldCheck, ArrowRight, Building2 } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username.trim(), form.password)
      toast.success('Signed in successfully')
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid ID or password. Please check and try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

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
            Enterprise HR & Operations Management
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.6, marginBottom: 40 }}>
            Streamline your workforce management with our premium, all-in-one HR console. From attendance tracking to payroll, everything in one place.
          </p>
          
          <div style={{ display: 'flex', gap: 32, opacity: 0.8 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>99.9%</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Uptime SLA</div>
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
        <div style={{ width: '100%', maxWidth: 400 }}>
          
          {/* Mobile brand (shows only if left side is hidden via CSS, but we're doing inline. Let's assume standard CSS hides .login-sidebar below 900px, so we show a small brand here) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }} className="mobile-only-brand">
            <div className="auth-brand-mark" style={{ width: 40, height: 40, fontSize: 16 }}>PL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>PL Soft Tech</div>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Welcome back</h2>
          <p style={{ fontSize: 15, color: 'var(--ink-light)', marginBottom: 32 }}>Please enter your credentials to sign in.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Employee / Intern ID</label>
              <input
                className="form-control"
                style={{ padding: '12px 16px', fontSize: 15 }}
                value={form.username}
                onChange={e=>setForm(f=>({...f,username:e.target.value}))}
                placeholder="e.g. EMP-001 or HR-admin"
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
                  onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  required
                  style={{ padding: '12px 16px', paddingRight: 42, fontSize: 15 }}
                />
                <button
                  type="button"
                  onClick={()=>setShowPwd(v=>!v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 0, display: 'flex' }}
                >
                  {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, justifyContent: 'center' }} type="submit" disabled={loading}>
              {loading ? 'Verifying Credentials…' : <>Sign in to Console <ArrowRight size={18}/></>}
            </button>
          </form>

          <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }}/>
            <div style={{ fontSize: 12.5, color: 'var(--ink-light)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>Secure Access Enabled.</strong> Your login is protected by enterprise-grade security. Role-based access control restricts visibility based on your assigned profile.
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
