import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Security() {
  const { user, refreshMe } = useAuth()
  const [form, setForm] = useState({ current_password:'', new_password:'', confirm:'' })
  const [show, setShow] = useState({ a:false, b:false, c:false })

  const mutation = useMutation({
    mutationFn: (d) => api.post('/auth/change-password/', d),
    onSuccess: async () => {
      toast.success('Password updated')
      setForm({ current_password:'', new_password:'', confirm:'' })
      await refreshMe()
    },
    onError: (e) => toast.error(e.response?.data?.current_password?.[0] || e.response?.data?.new_password?.[0] || 'Could not update password')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) { toast.error('New passwords do not match'); return }
    mutation.mutate({ current_password: form.current_password, new_password: form.new_password })
  }

  return (
    <div>
      <div className="page-header"><div><h2 className="page-header-title">Security</h2><p className="page-header-sub">Manage your account password</p></div></div>

      {user?.must_change_password && (
        <div className="card" style={{background:'var(--amber-50)',border:'1px solid #EFC79A',marginBottom:20,display:'flex',gap:12,alignItems:'flex-start'}}>
          <ShieldAlert size={18} style={{color:'#A85A1C',flexShrink:0,marginTop:1}}/>
          <div style={{fontSize:13,color:'#7A4514'}}>You're using a temporary password (your mobile number). Please set a new password below before continuing.</div>
        </div>
      )}

      <div className="card" style={{maxWidth:460}}>
        <div className="card-header"><span className="card-title">Change password</span></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current password</label>
            <div style={{position:'relative'}}>
              <input className="form-control" type={show.a?'text':'password'} value={form.current_password} onChange={e=>setForm(f=>({...f,current_password:e.target.value}))} required style={{paddingRight:40}}/>
              <button type="button" onClick={()=>setShow(s=>({...s,a:!s.a}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--slate)'}}>{show.a?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">New password</label>
            <div style={{position:'relative'}}>
              <input className="form-control" type={show.b?'text':'password'} value={form.new_password} onChange={e=>setForm(f=>({...f,new_password:e.target.value}))} required minLength={4} style={{paddingRight:40}}/>
              <button type="button" onClick={()=>setShow(s=>({...s,b:!s.b}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--slate)'}}>{show.b?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <div style={{position:'relative'}}>
              <input className="form-control" type={show.c?'text':'password'} value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} required style={{paddingRight:40}}/>
              <button type="button" onClick={()=>setShow(s=>({...s,c:!s.c}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--slate)'}}>{show.c?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{width:'100%',justifyContent:'center'}} disabled={mutation.isPending}>
            <KeyRound size={15}/> {mutation.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
