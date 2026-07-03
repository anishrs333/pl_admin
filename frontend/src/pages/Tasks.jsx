import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, CheckCircle, Edit2, Trash2, ClipboardList, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useNotif } from '../context/NotificationContext'

const PRIORITY_BADGE = { low: 'badge-gray', medium: 'badge-indigo', high: 'badge-amber', urgent: 'badge-red' }
const STATUS_BADGE = { pending: 'badge-gray', in_progress: 'badge-indigo', completed: 'badge-green' }
const emptyForm = { title: '', description: '', assignee: '', priority: 'medium', status: 'pending', deadline: '' }

export default function Tasks() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { fetchCount } = useNotif()
  const isHR = user?.role === 'hr'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [confirmDone, setConfirmDone] = useState(null) // task to mark done
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  const queryKey = ['tasks', search, statusFilter]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      return api.get(`/tasks/?${params}`).then(r => r.data)
    }
  })

  const { data: emps } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get('/employees/').then(r => r.data),
    enabled: isHR
  })

  const { data: interns } = useQuery({
    queryKey: ['interns-list'],
    queryFn: () => api.get('/internships/').then(r => r.data),
    enabled: isHR
  })

  const saveMutation = useMutation({
    mutationFn: (d) => {
      const { assignee, ...rest } = d
      const payload = { ...rest, assigned_to: null, assigned_to_intern: null }
      if (assignee) {
        const [type, id] = assignee.split(':')
        if (type === 'employee') payload.assigned_to = id
        else if (type === 'intern') payload.assigned_to_intern = id
      }
      return editId ? api.patch(`/tasks/${editId}/`, payload) : api.post('/tasks/', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries(['tasks'])
      setModal(false)
      toast.success(editId ? 'Task updated' : 'Task assigned — notified')
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.non_field_errors?.[0] || 'Error saving task')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Task deleted') }
  })

  const completeMutation = useMutation({
    mutationFn: (id) => api.post(`/tasks/${id}/complete/`),
    onSuccess: () => {
      qc.invalidateQueries(['tasks'])
      setConfirmDone(null)
      toast.success('Task marked as complete!')
      fetchCount() // refresh notification badge for HR
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to complete task')
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const tasks = data?.results || data || []
  const employees = emps?.results || emps || []
  const internList = interns?.results || interns || []

  const isOverdue = (task) => task.status !== 'completed' && task.deadline < new Date().toISOString().slice(0, 10)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{isHR ? 'Tasks' : 'My Tasks'}</h2>
          <p className="page-header-sub">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        {isHR && (
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setModal(true) }}>
            <Plus size={15} /> Assign task
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search className="search-icon" size={16} />
          <input
            className="form-control"
            style={{ paddingLeft: 36 }}
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
          <div className="table-wrap" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  {isHR && <th>Assigned to</th>}
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} style={{ opacity: t.status === 'completed' ? 0.65 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.title}
                        {isOverdue(t) && <AlertCircle size={13} style={{ color: 'var(--red)' }} title="Overdue" />}
                      </div>
                      {t.description && <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{t.description.slice(0, 70)}{t.description.length > 70 ? '…' : ''}</div>}
                    </td>
                    {isHR && <td style={{ fontSize: 13 }}>{t.assigned_to_name}</td>}
                    <td><span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        <Clock size={12} style={{ color: isOverdue(t) ? 'var(--red)' : 'var(--slate)' }} />
                        <span style={{ color: isOverdue(t) ? 'var(--red)' : 'inherit' }}>{t.deadline}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status.replace('_', ' ')}</span></td>
                    <td>
                      <div className="action-btns">
                        {isHR && (
                          <>
                            <button className="action-btn" onClick={() => { setForm({ ...t, assignee: t.assigned_to ? `employee:${t.assigned_to}` : (t.assigned_to_intern ? `intern:${t.assigned_to_intern}` : '') }); setEditId(t.id); setModal(true) }}>
                              <Edit2 size={13} /> Edit
                            </button>
                            <button className="action-btn" onClick={() => { if (window.confirm('Delete this task?')) deleteMutation.mutate(t.id) }}>
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                        {t.status !== 'completed' && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setConfirmDone(t)}
                          >
                            <CheckCircle size={13} /> Done
                          </button>
                        )}
                        {t.status === 'completed' && (
                          <span style={{ fontSize: 12, color: '#1F7A45', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={13} /> Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && (
              <div className="empty-state">
                <ClipboardList size={44} />
                <p>No tasks found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Done Modal */}
      {confirmDone && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={24} style={{ color: '#1F7A45' }} />
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: 8, fontSize: 17 }}>Mark Task as Done?</h3>
            <p style={{ textAlign: 'center', color: 'var(--slate)', fontSize: 14, marginBottom: 6 }}>
              <strong>"{confirmDone.title}"</strong>
            </p>
            <p style={{ textAlign: 'center', color: 'var(--slate)', fontSize: 13, marginBottom: 24 }}>
              {isHR ? 'This will notify the employee.' : 'This will notify the HR team that you completed this task.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDone(null)}>Cancel</button>
              <button
                className="btn btn-success"
                style={{ flex: 1 }}
                onClick={() => completeMutation.mutate(confirmDone.id)}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? 'Saving…' : '✓ Yes, mark done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {isHR && modal && (
        <Modal
          title={editId ? 'Edit task' : 'Assign task'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save task'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Task title *</label>
            <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Complete Q2 report" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Task details, acceptance criteria…" style={{ resize: 'vertical' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign to *</label>
              <select className="form-control" value={form.assignee} onChange={e => set('assignee', e.target.value)} required>
                <option value="">Select employee or intern</option>
                <optgroup label="Employees">
                  {employees.map(e => <option key={`employee:${e.id}`} value={`employee:${e.id}`}>{e.full_name}</option>)}
                </optgroup>
                <optgroup label="Interns">
                  {internList.map(i => <option key={`intern:${i.id}`} value={`intern:${i.id}`}>{i.name}</option>)}
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Deadline *</label>
              <input className="form-control" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
