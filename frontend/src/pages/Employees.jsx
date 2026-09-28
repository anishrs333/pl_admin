import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Edit2, Trash2, Camera, Users, Loader2, 
  Mail, Send, Building2, Briefcase, Filter, X 
} from 'lucide-react'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import IDBadge from '../components/IDBadge'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'
import SendPayslipModal from '../components/SendPayslipModal'
import { useAuth } from '../context/AuthContext'

const statusBadge = { active: 'badge-green', inactive: 'badge-gray', probation: 'badge-amber', on_leave: 'badge-indigo' }
const avatarColors = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EC4899', '#06B6D4']
const emptyForm = { 
  full_name: '', email: '', mobile: '', department: '', designation: '', 
  joining_date: '', salary: '', address: '', emergency_contact_name: '', emergency_contact: '', status: 'active' 
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

function Avatar({ emp, size = 38 }) {
  if (emp.profile_picture_url) {
    return <img src={emp.profile_picture_url} alt={emp.full_name || 'Profile'} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
  }
  const name = emp.full_name || emp.name || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const color = avatarColors[(emp.id || 0) % avatarColors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      {initials}
    </div>
  )
}

export default function Employees() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isFullHR = user?.role === 'hr'
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [picFile, setPicFile] = useState(null)
  const [picPreview, setPicPreview] = useState(null)
  const picRef = useRef(null)
  const [payslipEmp, setPayslipEmp] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => api.get(`/employees/?search=${encodeURIComponent(search)}`).then(r => r.data)
  })
  const { data: deptsData } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/employees/departments/').then(r => r.data) })
  const { data: desigsData } = useQuery({ queryKey: ['designations'], queryFn: () => api.get('/employees/designations/').then(r => r.data) })

  const departmentsList = useMemo(() => deptsData?.results || deptsData || [], [deptsData])
  const designationsList = useMemo(() => desigsData?.results || desigsData || [], [desigsData])

  // Dynamically filter designations based on selected department in form
  const availableDesignations = useMemo(() => {
    if (!form.department) return designationsList
    return designationsList.filter(d => 
      String(d.department) === String(form.department) || 
      String(d.department_name) === String(form.department)
    )
  }, [form.department, designationsList])

  const saveMutation = useMutation({
    mutationFn: async (d) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => {
        if (['profile_picture', 'profile_picture_url', 'document'].includes(k)) return
        if (v !== null && v !== undefined && v !== '') fd.append(k, v)
      })
      if (picFile) fd.append('profile_picture', picFile)
      const cfg = { headers: { 'Content-Type': undefined } }
      return editId ? api.patch(`/employees/${editId}/`, fd, cfg) : api.post('/employees/', fd, cfg)
    },
    onSuccess: (res) => {
      qc.invalidateQueries(['employees'])
      closeModal()
      if (res && res.data && res.data.warning) {
        toast.error(res.data.warning, { duration: 6000 })
      } else {
        toast.success(editId ? 'Employee record updated' : 'Employee added successfully — login provisioned')
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
          toast.error(e.message || 'Error saving employee')
        }
      } catch {
        toast.error('An unexpected error occurred')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['employees']); toast.success('Employee removed') }
  })

  const resendEmailMutation = useMutation({
    mutationFn: (id) => api.post(`/employees/${id}/resend_welcome_email/`),
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

  const openEdit = (emp) => {
    setForm({ ...emp, department: emp.department || '', designation: emp.designation || '' })
    setEditId(emp.id)
    setPicFile(null)
    setPicPreview(emp.profile_picture_url || null)
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

  const rawEmployees = data?.results || data || []

  // Client-side filtering by department & status
  const employees = useMemo(() => {
    return rawEmployees.filter(emp => {
      if (deptFilter !== 'all' && String(emp.department) !== String(deptFilter)) return false
      if (statusFilter !== 'all' && emp.status !== statusFilter) return false
      return true
    })
  }, [rawEmployees, deptFilter, statusFilter])

  // Summary Metrics
  const activeCount = rawEmployees.filter(e => e.status === 'active').length
  const probationCount = rawEmployees.filter(e => e.status === 'probation').length
  const leaveCount = rawEmployees.filter(e => e.status === 'on_leave').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Employee Directory</h2>
          <p className="page-header-sub">{rawEmployees.length} total employees on record</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add employee</button>
      </div>

      {/* Summary Stat Widgets */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label">Total Employees</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800 }}>{rawEmployees.length}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label" style={{ color: '#059669' }}>Active</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{activeCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label" style={{ color: '#D97706' }}>Probation</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800, color: '#D97706' }}>{probationCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
          <div className="stat-label" style={{ color: '#4F46E5' }}>On Leave</div>
          <div className="stat-value" style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5' }}>{leaveCount}</div>
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
              placeholder="Search employee by name, ID (e.g. EMP-PL-001), email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={15} style={{ color: 'var(--slate)' }} />
              <select 
                className="form-control" 
                style={{ width: 'auto', fontSize: 13, padding: '8px 12px' }}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments ({departmentsList.length})</option>
                {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                <option value="probation">Probation</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {(deptFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button 
                className="btn btn-ghost" 
                style={{ fontSize: 12, padding: '8px 12px' }}
                onClick={() => { setSearch(''); setDeptFilter('all'); setStatusFilter('all') }}
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Roster Table / Card View */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? <Loading /> : (
          employees.length === 0 ? (
            <EmptyState 
              icon={Users} 
              title="No employees found" 
              description={search || deptFilter !== 'all' || statusFilter !== 'all' ? "No records match your filter criteria." : "Click 'Add employee' to register your first team member."} 
            />
          ) : (
            <ResponsiveTable
              headers={['Employee', 'ID', 'Department', 'Designation', 'Status', 'Actions']}
              data={employees}
              renderRow={(emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="name-cell">
                      <Avatar emp={emp} />
                      <div>
                        <div className="name" style={{ fontWeight: 600 }}>{emp.full_name}</div>
                        <div className="sub" style={{ fontSize: 12, color: 'var(--slate)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><IDBadge code={emp.employee_id} label="EMP" size="sm" /></td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{emp.department_name || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--slate)' }}>{emp.designation_name || '—'}</td>
                  <td><span className={`badge ${statusBadge[emp.status] || 'badge-gray'}`}>{emp.status.replace('_', ' ')}</span></td>
                  <td>
                    <div className="action-btns">
                      {isFullHR && <button className="action-btn" title="Send Payslip Email" onClick={() => setPayslipEmp(emp)}><Send size={13} /></button>}
                      <button className="action-btn" title="Resend Welcome Login Email" onClick={() => { if (window.confirm(`Resend login credentials to ${emp.email}?`)) resendEmailMutation.mutate(emp.id) }}><Mail size={13} /></button>
                      <button className="action-btn" onClick={() => openEdit(emp)}><Edit2 size={13} /> Edit</button>
                      <button className="action-btn" onClick={() => { if (window.confirm(`Remove ${emp.full_name}?`)) deleteMutation.mutate(emp.id) }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )}
              renderCard={(emp) => (
                <MobileCard
                  key={emp.id}
                  avatar={<Avatar emp={emp} />}
                  title={emp.full_name}
                  subtitle={`${emp.department_name || ''} ${emp.designation_name ? '• ' + emp.designation_name : ''}`}
                  badges={
                    <>
                      <IDBadge code={emp.employee_id} label="EMP" size="sm" />
                      <span className={`badge ${statusBadge[emp.status] || 'badge-gray'}`}>{emp.status.replace('_', ' ')}</span>
                    </>
                  }
                  actions={
                    <>
                      {isFullHR && <button className="action-btn" onClick={() => setPayslipEmp(emp)}><Send size={13} /> Send Payslip</button>}
                      <button className="action-btn" title="Resend Email" onClick={() => { if (window.confirm(`Resend login email to ${emp.email}?`)) resendEmailMutation.mutate(emp.id) }}><Mail size={13} /> Resend Email</button>
                      <button className="action-btn" onClick={() => openEdit(emp)}><Edit2 size={13} /> Edit</button>
                      <button className="action-btn" onClick={() => { if (window.confirm(`Remove ${emp.full_name}?`)) deleteMutation.mutate(emp.id) }}><Trash2 size={13} /> Delete</button>
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
          title={editId ? 'Edit Employee Details' : 'Add New Employee'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 size={14} className="spin-icon" /> Saving Employee…</> : 'Save Employee'}
              </button>
            </>
          }
        >
          {/* Profile Picture Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div
              style={{ 
                width: 84, height: 84, borderRadius: '50%', background: 'var(--indigo-50)', 
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
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={form.full_name} onChange={e => set('full_name', e.target.value)} required placeholder="e.g. John Doe" /></div>
            <div className="form-group"><label className="form-label">Email Address *</label><input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="john@company.com" /></div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile Number * <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(initial login password)</span></label>
              <input className="form-control" value={form.mobile} onChange={e => set('mobile', e.target.value)} required placeholder="9876543210" />
            </div>
            <div className="form-group"><label className="form-label">Basic Salary (₹) *</label><input className="form-control" type="number" value={form.salary} onChange={e => set('salary', e.target.value)} required placeholder="30000" /></div>
          </div>

          {/* Department & Dynamic Designation Selection */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select 
                className="form-control" 
                value={form.department || ''} 
                onChange={e => {
                  set('department', e.target.value)
                  set('designation', '') // reset designation when department changes
                }}
                required
              >
                <option value="">Select Department</option>
                {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation *</label>
              <select 
                className="form-control" 
                value={form.designation || ''} 
                onChange={e => set('designation', e.target.value)}
                disabled={!form.department && availableDesignations.length === 0}
                required
              >
                <option value="">{form.department ? 'Select Designation' : 'Select Department first'}</option>
                {availableDesignations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Joining Date *</label>
              <input className="form-control" type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group"><label className="form-label">Address</label><textarea className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address details…" /></div>

          <div className="form-row">
            <div className="form-group"><label className="form-label">Emergency Contact Name</label><input className="form-control" value={form.emergency_contact_name || ''} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Contact Person" /></div>
            <div className="form-group"><label className="form-label">Emergency Contact Phone</label><input className="form-control" value={form.emergency_contact || ''} onChange={e => set('emergency_contact', e.target.value)} placeholder="Emergency Mobile" /></div>
          </div>

          {!editId && (
            <div style={{ background: 'var(--indigo-50)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--indigo-deep)' }}>
              Unique ID <strong>EMP-PL-XXX</strong> and user login account are automatically provisioned on save.
            </div>
          )}
        </Modal>
      )}

      {payslipEmp && (
        <SendPayslipModal person={payslipEmp} type="employee" onClose={() => setPayslipEmp(null)} />
      )}
    </div>
  )
}
