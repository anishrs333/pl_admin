import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">PL</div>
          <div>
            <div style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:600,color:'var(--ink)'}}>PL Soft Tech</div>
            <div style={{fontSize:11,color:'var(--slate)',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600,marginTop:1}}>HR Console</div>
          </div>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-sub">Enter your HR username, Employee ID, or Intern ID</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ID</label>
            <input
              className="form-control mono"
              value={form.username}
              onChange={e=>setForm(f=>({...f,username:e.target.value}))}
              required
              autoFocus
              autoCapitalize="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{position:'relative'}}>
              <input
                className="form-control"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                required
                style={{paddingRight:42}}
              />
              <button
                type="button"
                onClick={()=>setShowPwd(v=>!v)}
                style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--slate)',padding:0,display:'flex'}}
              >
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" style={{width:'100%',padding:'12px',fontSize:14,marginTop:6,justifyContent:'center'}} type="submit" disabled={loading}>
            {loading ? 'Verifying…' : <>Sign in <ArrowRight size={15}/></>}
          </button>
        </form>

        <div style={{marginTop:24,display:'flex',gap:9,alignItems:'flex-start',background:'var(--indigo-50)',borderRadius:10,padding:'12px 14px'}}>
          <ShieldCheck size={16} style={{color:'var(--indigo)',flexShrink:0,marginTop:1}}/>
          <div style={{fontSize:11.5,color:'var(--indigo-deep)',lineHeight:1.5}}>
            HR has full console access. Employees and interns see only their own record — access is enforced at the account level.
          </div>
        </div>
      </div>
    </div>
  )
}
