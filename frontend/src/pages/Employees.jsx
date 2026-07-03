import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Camera, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import IDBadge from '../components/IDBadge'

const statusBadge = { active: 'badge-green', inactive: 'badge-gray', probation: 'badge-amber', on_leave: 'badge-indigo' }
const avatarColors = ['#312E6B', '#7C3AED', '#1F7A45', '#D97B29']
const emptyForm = { full_name: '', email: '', mobile: '', department: '', designation: '', joining_date: '', salary: '', address: '', emergency_contact_name: '', emergency_contact: '', status: 'active' }

function Avatar({ emp, size = 36 }) {
  if (emp.profile_picture_url) {
    return <img src={emp.profile_picture_url} alt={emp.full_name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  const initials = emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const color = avatarColors[emp.id % avatarColors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export default function Employees() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [picFile, setPicFile] = useState(null)
  const [picPreview, setPicPreview] = useState(null)
  const picRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => api.get(`/employees/?search=${encodeURIComponent(search)}`).then(r => r.data)
  })
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/employees/departments/').then(r => r.data) })
  const { data: desigs } = useQuery({ queryKey: ['designations'], queryFn: () => api.get('/employees/designations/').then(r => r.data) })

  const saveMutation = useMutation({
    mutationFn: async (d) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') fd.append(k, v) })
      if (picFile) fd.append('profile_picture', picFile)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      return editId ? api.patch(`/employees/${editId}/`, fd, cfg) : api.post('/employees/', fd, cfg)
    },
    onSuccess: () => {
      qc.invalidateQueries(['employees'])
      setModal(false); setForm(emptyForm); setEditId(null); setPicFile(null); setPicPreview(null)
      toast.success(editId ? 'Employee updated' : 'Employee added — login provisioned')
    },
    onError: (e) => toast.error(Object.values(e.response?.data || {})[0]?.[0] || 'Error saving')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['employees']); toast.success('Employee removed') }
  })

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
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setPicFile(file)
    setPicPreview(URL.createObjectURL(file))
  }

  const employees = data?.results || data || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Employees</h2>
          <p className="page-header-sub">{employees.length} on record</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add employee</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 22px 0' }}>
          <div className="search-wrap" style={{ marginBottom: 18 }}>
            <Search className="search-icon" size={16} />
            <input
              className="form-control"
              style={{ paddingLeft: 36, maxWidth: 320 }}
              placeholder="Search by name, email, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
          <div className="table-wrap" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr><th>Employee</th><th>ID</th><th>Department</th><th>Designation</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="name-cell">
                        <Avatar emp={emp} />
                        <div><div className="name">{emp.full_name}</div><div className="sub">{emp.email}</div></div>
                      </div>
                    </td>
                    <td><IDBadge code={emp.employee_id} label="EMP" size="sm" /></td>
                    <td style={{ fontSize: 13 }}>{emp.department_name || '—'}</td>
                    <td style={{ fontSize: 13 }}>{emp.designation_name || '—'}</td>
                    <td><span className={`badge ${statusBadge[emp.status] || 'badge-gray'}`}>{emp.status.replace('_', ' ')}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn" onClick={() => openEdit(emp)}><Edit2 size={13} /> Edit</button>
                        <button className="action-btn" onClick={() => { if (window.confirm('Remove employee?')) deleteMutation.mutate(emp.id) }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && <div className="empty-state"><Users size={44} /><p>No employees yet.</p></div>}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={editId ? 'Edit employee' : 'Add employee'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save employee'}
              </button>
            </>
          }
        >
          {/* Profile Picture */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div
              style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--indigo-50)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
              onClick={() => picRef.current?.click()}
            >
              {picPreview
                ? <img src={picPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={24} style={{ color: 'var(--slate)' }} />
              }
            </div>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => picRef.current?.click()}>
              {picPreview ? 'Change photo' : 'Upload photo'}
            </button>
            <input ref={picRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePic} />
          </div>

          <div className="form-row">
            <div className="form-group"><label className="form-label">Full name *</label><input className="form-control" value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile * <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(initial password)</span></label>
              <input className="form-control" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
            </div>
            <div className="form-group"><label className="form-label">Salary (₹) *</label><input className="form-control" type="number" value={form.salary} onChange={e => set('salary', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" value={form.department || ''} onChange={e => set('department', e.target.value)}>
                <option value="">Select department</option>
                {(depts?.results || depts || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <select className="form-control" value={form.designation || ''} onChange={e => set('designation', e.target.value)}>
                <option value="">Select designation</option>
                {(desigs?.results || desigs || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Joining date *</label>
              <input className="form-control" type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="on_leave">On leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Address</label><textarea className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Emergency contact name</label><input className="form-control" value={form.emergency_contact_name || ''} onChange={e => set('emergency_contact_name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Emergency contact no.</label><input className="form-control" value={form.emergency_contact || ''} onChange={e => set('emergency_contact', e.target.value)} /></div>
          </div>
          {!editId && (
            <div style={{ background: 'var(--indigo-50)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--indigo-deep)' }}>
              ID <strong>PL-EMP-{form.joining_date ? form.joining_date.slice(0, 4) : 'YYYY'}-NNNN</strong> and login are auto-generated on save.
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
