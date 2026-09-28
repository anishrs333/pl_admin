import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Edit2, Trash2, Camera, GraduationCap, Loader2, 
  Mail, FileText, Send, Filter, X, Award, CheckCircle2 
} from 'lucide-react'
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
const emptyForm = { 
  name: '', email: '', mobile: '', college_name: '', domain: 'Software Development', 
  description: '', mentor: '', start_date: '', end_date: '', status: 'active', 
  performance_score: '', certificate_issued: false, internship_type: 'unpaid', stipend_amount: '', payment_date: '' 
}

const DOMAIN_OPTIONS = [
  'Software Development',
  'Quality Assurance',
  'Human Resources',
  'Marketing',
  'Sales & Business Development',
  'Finance & Accounts',
]

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

function Avatar({ intern, size = 38 }) {
  if (intern.profile_picture_url) {
    return <img src={intern.profile_picture_url} alt={intern.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
  }
  const initials = (intern.name || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      {initials}
    </div>
  )
}

export default function Internships() {
  const { user } = useAuth()
  const isFullHR = user?.role === 'hr'
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
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

  const employeesList = useMemo(() => emps?.results || emps || [], [emps])

  const saveMutation = useMutation({
    mutationFn: async (d) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => {
        if (['profile_picture', 'profile_picture_url', 'document', 'tasks'].includes(k)) return
        if (v !== null && v !== undefined && v !== '') fd.append(k, v)
      })
      if (picFile) fd.append('profile_picture', picFile)
      const cfg = { headers: { 'Content-Type': undefined } }
      return editId ? api.patch(`/internships/${editId}/`, fd, cfg) : api.post('/internships/', fd, cfg)
    },
    onSuccess: (res) => {
      qc.invalidateQueries(['internships'])
      closeModal()
      if (res && res.data && res.data.warning) {
        toast.error(res.data.warning, { duration: 6000 })
      } else {
        toast.success(editId ? 'Intern updated' : 'Intern registered — login provisioned')
      }
    },
    onError: (e) => {
      try {
        const d = e.response?.data
        if (typeof d === 'string') {
          toast.error(d.slice(0, 200) || 'Error saving')
        } else if (d && typeof d === 'object') {
          const firstKey = Object.keys(d)[0]
          const firstVal = Array.isArray(d[firstKey]) ? d[firstKey][0] : d[firstKey]
          toast.error(`${firstKey.replace('_', ' ')}: ${firstVal}`)
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
    onSuccess: (res) => toast.success(res.data?.detail || 'Welcome email sent successfully'),
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to send welcome email')
  })

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
    setForm({ ...intern, mentor: intern.mentor || '' })
    setEditId(intern.id)
    setPicFile(null)
    setPicPreview(intern.profile_picture_url || null)
    setModal(true)
  }

  const openAdd = () => { setForm(emptyForm); setEditId(null); setPicFile(null); setPicPreview(null); setModal(true) }
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
    } catch {
      toast.error('Failed to preview image')
      setPicFile(null)
      setPicPreview(null)
    }
  }

  const handleDownloadReceipt = async (internId) => {
    try {
      const res = await api.get(`/internships/${internId}/receipt-pdf/`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Internship_Fee_Receipt_${internId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download receipt')
    }
  }

  const rawInterns = data?.results || data || []

  // Client-side filtering
  const interns = useMemo(() => {
    return rawInterns.filter(i => {
      if (domainFilter !== 'all' && i.domain !== domainFilter) return false
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      return true
    })
  }, [rawInterns, domainFilter, statusFilter])

  // Summary Metrics
  const activeCount = rawInterns.filter(i => i.status === 'active').length
  const completedCount = rawInterns.filter(i => i.status === 'completed').length
  const terminatedCount = rawInterns.filter(i => i.status === 'terminated').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Internship Management</h2>
          <p className="page-header-sub">{rawInterns.length} total interns on record</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add intern</button>
      </div>

      {/* Summary Stat Widgets */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label">Total Interns</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800 }}>{rawInterns.length}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label" style={{ color: '#059669' }}>Active</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{activeCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label" style={{ color: '#D97706' }}>Completed</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800, color: '#D97706' }}>{completedCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label" style={{ color: '#DC2626' }}>Terminated</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800, color: '#DC2626' }}>{terminatedCount}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search className="search-icon" size={16} />
            <input
              className="form-control"
              style={{ paddingLeft: 36, fontSize: 14 }}
              placeholder="Search intern by name, ID (e.g. INT-PL-001), college, domain…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GraduationCap size={15} style={{ color: 'var(--slate)' }} />
              <select 
                className="form-control" 
                style={{ width: 'auto', fontSize: 13, padding: '8px 12px' }}
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
              >
                <option value="all">All Domains</option>
                {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} style={{ color: 'var(--slate)' }} />
              <select 
                className="form-control" 
                style={{ width: 'auto', fontSize: 13, padding: '8px 12px' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            {(domainFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button 
                className="btn btn-ghost" 
                style={{ fontSize: 12, padding: '8px 12px' }}
                onClick={() => { setSearch(''); setDomainFilter('all'); setStatusFilter('all') }}
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interns Table & Cards */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? <Loading /> : (
          interns.length === 0 ? (
            <EmptyState 
              icon={GraduationCap} 
              title="No interns found" 
              description={search || domainFilter !== 'all' || statusFilter !== 'all' ? "No intern records match your filters." : "Click 'Add intern' to register your first intern."} 
            />
          ) : (
            <ResponsiveTable
              headers={['Intern', 'ID', 'Domain & College', 'Type', 'Status', 'Actions']}
              data={interns}
              renderRow={(intern) => (
                <tr key={intern.id}>
                  <td>
                    <div className="name-cell">
                      <Avatar intern={intern} />
                      <div>
                        <div className="name" style={{ fontWeight: 600 }}>{intern.name}</div>
                        <div className="sub" style={{ fontSize: 12, color: 'var(--slate)' }}>{intern.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><IDBadge code={intern.intern_id} label="INT" size="sm" /></td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{intern.domain}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate)' }}>{intern.college_name}</div>
                  </td>
                  <td>
                    <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                      {intern.internship_type} {intern.stipend_amount ? `(₹${intern.stipend_amount})` : ''}
                    </span>
                  </td>
                  <td><span className={`badge ${statusBadge[intern.status] || 'badge-gray'}`}>{intern.status}</span></td>
                  <td>
                    <div className="action-btns">
                      {isFullHR && <button className="action-btn" title="Send Payslip/Stipend" onClick={() => setPayslipIntern(intern)}><Send size={13} /></button>}
                      {intern.stipend_amount && (
                        <button className="action-btn" title="Download Receipt PDF" onClick={() => handleDownloadReceipt(intern.id)}><FileText size={13} /></button>
                      )}
                      <button className="action-btn" title="Resend Welcome Email" onClick={() => { if (window.confirm(`Resend login email to ${intern.email}?`)) resendEmailMutation.mutate(intern.id) }}><Mail size={13} /></button>
                      <button className="action-btn" onClick={() => openEdit(intern)}><Edit2 size={13} /> Edit</button>
                      <button className="action-btn" onClick={() => { if (window.confirm(`Remove ${intern.name}?`)) deleteMutation.mutate(intern.id) }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )}
              renderCard={(intern) => (
                <MobileCard
                  key={intern.id}
                  avatar={<Avatar intern={intern} />}
                  title={intern.name}
                  subtitle={`${intern.domain || ''} • ${intern.college_name || ''}`}
                  badges={
                    <>
                      <IDBadge code={intern.intern_id} label="INT" size="sm" />
                      <span className={`badge ${statusBadge[intern.status] || 'badge-gray'}`}>{intern.status}</span>
                    </>
                  }
                  actions={
                    <>
                      {isFullHR && <button className="action-btn" onClick={() => setPayslipIntern(intern)}><Send size={13} /> Payslip</button>}
                      {intern.stipend_amount && (
                        <button className="action-btn" onClick={() => handleDownloadReceipt(intern.id)}><FileText size={13} /> Receipt</button>
                      )}
                      <button className="action-btn" onClick={() => { if (window.confirm(`Resend login email to ${intern.email}?`)) resendEmailMutation.mutate(intern.id) }}><Mail size={13} /> Email</button>
                      <button className="action-btn" onClick={() => openEdit(intern)}><Edit2 size={13} /> Edit</button>
                      <button className="action-btn" onClick={() => { if (window.confirm(`Remove ${intern.name}?`)) deleteMutation.mutate(intern.id) }}><Trash2 size={13} /> Delete</button>
                    </>
                  }
                />
              )}
            />
          )
        )}
      </div>

      {/* Form Modal */}
      {modal && (
        <Modal
          title={editId ? 'Edit Intern Details' : 'Add New Intern'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 size={14} className="spin-icon" /> Saving Intern…</> : 'Save Intern'}
              </button>
            </>
          }
        >
          {/* Profile Picture Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div
              style={{ 
                width: 84, height: 84, borderRadius: '50%', background: 'var(--amber-50)', 
                border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' 
              }}
              onClick={() => picRef.current?.click()}
            >
              {picPreview
                ? <img src={picPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={26} style={{ color: 'var(--slate)' }} />
              }
            </div>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => picRef.current?.click()}>
              {picPreview ? 'Change photo' : 'Upload photo'}
            </button>
            <input ref={picRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handlePic} />
          </div>

          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Alex Smith" /></div>
            <div className="form-group"><label className="form-label">Email Address *</label><input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="alex@college.edu" /></div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile Number * <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(initial login password)</span></label>
              <input className="form-control" value={form.mobile} onChange={e => set('mobile', e.target.value)} required placeholder="9876543210" />
            </div>
            <div className="form-group"><label className="form-label">College / University *</label><input className="form-control" value={form.college_name} onChange={e => set('college_name', e.target.value)} required placeholder="e.g. SRM Institute" /></div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Domain / Department *</label>
              <select className="form-control" value={form.domain} onChange={e => set('domain', e.target.value)} required>
                {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Mentor</label>
              <select className="form-control" value={form.mentor || ''} onChange={e => set('mentor', e.target.value)}>
                <option value="">Select Mentor Employee</option>
                {employeesList.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Internship Type</label>
              <select className="form-control" value={form.internship_type} onChange={e => set('internship_type', e.target.value)}>
                <option value="unpaid">Non-Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {form.internship_type === 'paid' && (
              <div className="form-group">
                <label className="form-label">Stipend Amount (₹)</label>
                <input className="form-control" type="number" value={form.stipend_amount || ''} onChange={e => set('stipend_amount', e.target.value)} placeholder="3000 or 5000" />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-control" type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-control" type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Performance Score (0 - 100)</label>
              <input className="form-control" type="number" min="0" max="100" value={form.performance_score || ''} onChange={e => set('performance_score', e.target.value)} placeholder="85" />
            </div>
          </div>

          <div className="form-group"><label className="form-label">Brief Description / Bio</label><textarea className="form-control" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Intern goals, bio, notes…" /></div>

          {!editId && (
            <div style={{ background: 'var(--amber-50)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#B45309' }}>
              Unique ID <strong>INT-PL-XXX</strong> and intern login credentials are auto-generated on save.
            </div>
          )}
        </Modal>
      )}

      {payslipIntern && (
        <SendPayslipModal person={payslipIntern} type="intern" onClose={() => setPayslipIntern(null)} />
      )}
    </div>
  )
}
