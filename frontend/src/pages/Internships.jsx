import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Camera, GraduationCap, Loader2, Mail, FileText, Send } from 'lucide-react'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import api, { getAccessToken } from '../lib/api'
import Modal from '../components/Modal'
import IDBadge from '../components/IDBadge'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'
import { useAuth } from '../context/AuthContext'
import SendPayslipModal from '../components/SendPayslipModal'

const statusBadge = { active: 'badge-green', completed: 'badge-gray', terminated: 'badge-red' }
const emptyForm = { name: '', email: '', mobile: '', college_name: '', domain: '', description: '', mentor: '', start_date: '', end_date: '', status: 'active', performance_score: '', certificate_issued: false, internship_type: 'unpaid', stipend_amount: '', payment_date: '' }

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

function Avatar({ intern, size = 36 }) {
  if (intern.profile_picture_url) {
    return <img src={intern.profile_picture_url} alt={intern.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  const initials = intern.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export default function Internships() {
  const { user } = useAuth()
  const isFullHR = user?.role === 'hr'
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [picFile, setPicFile] = useState(null)
  const [picPreview, setPicPreview] = useState(null)
  const picRef = useRef(null)
  const [payslipIntern, setPayslipIntern] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['internships', search],
    queryFn: () => api.get(`/internships/?search=${encodeURIComponent(search)}`).then(r => r.data)
  })
  const { data: emps } = useQuery({ queryKey: ['employees-list'], queryFn: () => api.get('/employees/').then(r => r.data) })

  const saveMutation = useMutation({
    mutationFn: async (d) => {
      try {
        const fd = new FormData()
        Object.entries(d).forEach(([k, v]) => {
          if (['profile_picture', 'profile_picture_url', 'document', 'tasks'].includes(k)) return
          if (v !== null && v !== undefined && v !== '') fd.append(k, v)
        })
        if (picFile) fd.append('profile_picture', picFile)
        const cfg = { headers: { 'Content-Type': undefined } }
        return editId ? api.patch(`/internships/${editId}/`, fd, cfg) : api.post('/internships/', fd, cfg)
      } catch (err) {
        throw err
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries(['internships'])
      closeModal()
      if (res && res.data && res.data.warning) {
        toast.error(res.data.warning, { duration: 6000 })
      } else {
        toast.success(editId ? 'Intern updated' : 'Intern added — login provisioned')
      }
    },
    onError: (e) => {
      try {
        const data = e.response?.data
        if (typeof data === 'string') {
          toast.error(data.slice(0, 200) || 'Error saving')
        } else if (data && typeof data === 'object') {
          const firstVal = Object.values(data)[0]
          const msg = Array.isArray(firstVal) ? firstVal[0] : (firstVal || data.detail || 'Error saving')
          toast.error(String(msg).slice(0, 200))
        } else {
          toast.error(e.message || 'Error saving intern')
        }
      } catch {
        toast.error('An unexpected error occurred')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/internships/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['internships']); toast.success('Intern removed') }
  })

  const resendEmailMutation = useMutation({
    mutationFn: (id) => api.post(`/internships/${id}/resend_welcome_email/`),
    onSuccess: (res) => toast.success(res.data?.detail || 'Email resent successfully'),
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to resend email')
  })

  const downloadReceipt = async (internId, internId_code) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      const token = getAccessToken()
      const url = `${import.meta.env.VITE_API_URL}/internships/${internId}/receipt-pdf/?inline=1&token=${token}`
      window.open(url, '_blank')
      return
    }

    try {
      const res = await api.get(`/internships/${internId}/receipt-pdf/`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt_${internId_code}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to download receipt')
    }
  }

  const closeModal = () => {
    setModal(false)
    setForm(emptyForm)
    setEditId(null)
    if (picPreview && picPreview.startsWith('blob:')) {
      URL.revokeObjectURL(picPreview)
    }
    setPicFile(null)
    setPicPreview(null)
  }

  const openEdit = (intern) => {
    setForm(intern)
    setEditId(intern.id)
    setPicFile(null)
    setPicPreview(intern.profile_picture_url || null)
    setModal(true)
  }

  const openAdd = () => {
    setForm(emptyForm)
    setEditId(null)
    setPicFile(null)
    setPicPreview(null)
    setModal(true)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePic = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WebP)')
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 2MB')
      e.target.value = ''
      return
    }

    if (picPreview && picPreview.startsWith('blob:')) {
      URL.revokeObjectURL(picPreview)
    }

    setPicFile(file)
    try {
      setPicPreview(URL.createObjectURL(file))
    } catch (err) {
      toast.error('Failed to preview the image')
      setPicFile(null)
      setPicPreview(null)
    }
  }

  const interns = data?.results || data || []
  const employees = emps?.results || emps || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Interns</h2>
          <p className="page-header-sub">{interns.length} registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add intern</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-header-mobile">
          <div className="search-wrap" style={{ marginBottom: 18 }}>
            <Search className="search-icon" size={16} />
            <input className="form-control" style={{ paddingLeft: 36, width: '100%' }} placeholder="Search by name, domain…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? <Loading /> : (
          interns.length === 0 ? <EmptyState icon={GraduationCap} title="No interns yet" description="Add your first intern to get started." /> :
          <ResponsiveTable
            headers={['Intern', 'ID', 'College', 'Domain', 'Type', 'Status', 'Actions']}
            data={interns}
            renderRow={(intern) => (
              <tr key={intern.id}>
                <td>
                  <div className="name-cell">
                    <Avatar intern={intern} />
                    <div><div className="name">{intern.name}</div><div className="sub">{intern.email}</div></div>
                  </div>
                </td>
                <td><IDBadge code={intern.intern_id} label="INT" size="sm" /></td>
                <td style={{ fontSize: 13 }}>{intern.college_name || '—'}</td>
                <td style={{ fontSize: 13 }}>{intern.domain || '—'}</td>
                <td><span className={`badge ${intern.internship_type === 'paid' ? 'badge-indigo' : 'badge-gray'}`}>{intern.internship_type === 'paid' ? 'Paid' : 'Non-Paid'}</span></td>
                <td><span className={`badge ${statusBadge[intern.status] || 'badge-gray'}`}>{intern.status}</span></td>
                <td>
                  <div className="action-btns">
                    {isFullHR && <button className="action-btn" title="Send Payslip" onClick={() => setPayslipIntern(intern)}><Send size={13} /></button>}
                    {isFullHR && intern.internship_type === 'paid' && (
                      <button className="action-btn" title="Download Payment Receipt" onClick={() => downloadReceipt(intern.id, intern.intern_id)}><FileText size={13} /> Receipt</button>
                    )}
                    <button className="action-btn" title="Resend Welcome Email" onClick={() => { if (window.confirm('Resend welcome email?')) resendEmailMutation.mutate(intern.id) }}><Mail size={13} /></button>
                    <button className="action-btn" onClick={() => openEdit(intern)}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove intern?')) deleteMutation.mutate(intern.id) }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            )}
            renderCard={(intern) => (
              <MobileCard
                key={intern.id}
                avatar={<Avatar intern={intern} />}
                title={intern.name}
                subtitle={intern.email}
                badges={
                  <>
                    <IDBadge code={intern.intern_id} label="INT" size="sm" />
                    <span className={`badge ${intern.internship_type === 'paid' ? 'badge-indigo' : 'badge-gray'}`}>{intern.internship_type === 'paid' ? 'Paid' : 'Non-Paid'}</span>
                    <span className={`badge ${statusBadge[intern.status] || 'badge-gray'}`}>{intern.status}</span>
                  </>
                }
                actions={
                  <>
                    {isFullHR && <button className="action-btn" onClick={() => setPayslipIntern(intern)}><Send size={13} /> Send Payslip</button>}
                    {isFullHR && intern.internship_type === 'paid' && (
                      <button className="action-btn" onClick={() => downloadReceipt(intern.id, intern.intern_id)}><FileText size={13} /> Receipt</button>
                    )}
                    <button className="action-btn" title="Resend Welcome Email" onClick={() => { if (window.confirm('Resend welcome email?')) resendEmailMutation.mutate(intern.id) }}><Mail size={13} /> Resend Email</button>
                    <button className="action-btn" onClick={() => openEdit(intern)}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove intern?')) deleteMutation.mutate(intern.id) }}><Trash2 size={13} /> Delete</button>
                  </>
                }
              />
            )}
          />
        )}
      </div>

      {modal && (
        <Modal
          title={editId ? 'Edit intern' : 'Add intern'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 size={14} className="spin-icon" /> Saving…</> : 'Save intern'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div
              style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--amber-50)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
              onClick={() => picRef.current?.click()}
            >
              {picPreview
                ? <img src={picPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={24} style={{ color: 'var(--slate)' }} />
              }
              {saveMutation.isPending && picFile && (
                <div className="upload-overlay">
                  <div className="spinner" style={{ width: 20, height: 20 }} />
                </div>
              )}
            </div>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => picRef.current?.click()}>
              {picPreview ? 'Change photo' : 'Upload photo'}
            </button>
            <input ref={picRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handlePic} />
          </div>

          <div className="form-row">
            <div className="form-group"><label className="form-label">Full name *</label><input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Mobile *</label><input className="form-control" value={form.mobile} onChange={e => set('mobile', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Domain *</label><input className="form-control" value={form.domain} onChange={e => set('domain', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">College name *</label><input className="form-control" value={form.college_name} onChange={e => set('college_name', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Mentor</label>
              <select className="form-control" value={form.mentor || ''} onChange={e => set('mentor', e.target.value)}>
                <option value="">Select mentor</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Internship Type *</label>
              <div className="radio-group" style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="internship_type" value="unpaid" checked={form.internship_type === 'unpaid'} onChange={e => { set('internship_type', e.target.value); set('stipend_amount', '') }} /> Non-Paid
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="internship_type" value="paid" checked={form.internship_type === 'paid'} onChange={e => set('internship_type', e.target.value)} /> Paid
                </label>
              </div>
              {form.internship_type === 'unpaid' && (
                <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4 }}>No internship fee — unpaid program.</div>
              )}
            </div>
            {form.internship_type === 'paid' && (
              <div className="form-group">
                <label className="form-label">Internship Fee *</label>
                <div className="radio-group" style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" name="stipend_amount" value="3000" checked={Number(form.stipend_amount) === 3000} onChange={e => set('stipend_amount', Number(e.target.value))} /> ₹3,000
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" name="stipend_amount" value="5000" checked={Number(form.stipend_amount) === 5000} onChange={e => set('stipend_amount', Number(e.target.value))} /> ₹5,000
                  </label>
                </div>
              </div>
            )}
            {form.internship_type === 'paid' && (
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input className="form-control" type="date" value={form.payment_date || ''} onChange={e => set('payment_date', e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4 }}>Date the intern paid the fee.</div>
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Start date *</label><input className="form-control" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">End date *</label><input className="form-control" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief bio or internship objective…" /></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
              </select>
              <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4 }}>Completed / Terminated will block login.</div>
            </div>
            <div className="form-group"><label className="form-label">Performance score (0-100)</label><input className="form-control" type="number" min="0" max="100" value={form.performance_score} onChange={e => set('performance_score', e.target.value)} /></div>
          </div>
        </Modal>
      )}

      {payslipIntern && (
        <SendPayslipModal person={payslipIntern} type="intern" onClose={() => setPayslipIntern(null)} />
      )}
    </div>
  )
}
