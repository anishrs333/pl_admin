import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Home, MapPin, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import IDBadge from '../components/IDBadge'
import { useAuth } from '../context/AuthContext'

const emptyForm = { date: '', reason: '', working_address: '', expected_hours: 8, task_description: '' }

export default function WFH() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isHR = user?.role === 'hr'
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [remarksModal, setRemarksModal] = useState({ open: false, type: '', id: null, notes: '' })

  const { data: wfhData, isLoading } = useQuery({ queryKey: ['wfh'], queryFn: () => api.get('/attendance/wfh/').then(r => r.data) })

  const applyMutation = useMutation({
    mutationFn: (d) => api.post('/attendance/wfh/', d),
    onSuccess: () => {
      qc.invalidateQueries(['wfh'])
      setModal(false)
      toast.success('WFH Request submitted successfully')
    },
    onError: () => toast.error('Failed to submit WFH request')
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, type, notes }) => api.post(`/attendance/wfh/${id}/${type}/`, { reviewer_notes: notes }),
    onSuccess: () => {
      qc.invalidateQueries(['wfh'])
      setRemarksModal({ open: false, type: '', id: null, notes: '' })
      toast.success('Action successful')
    },
    onError: () => toast.error('Failed to perform action')
  })

  const requests = wfhData?.results || wfhData || []
  
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const rejectedCount = requests.filter(r => r.status === 'rejected').length
  const todayCount = requests.filter(r => r.status === 'approved' && r.date === new Date().toISOString().split('T')[0]).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Work From Home</h2>
          <p className="page-header-sub">{isHR ? 'Manage remote work requests' : 'Apply and track your WFH requests'}</p>
        </div>
        {!isHR && (
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal(true) }}>
            <Plus size={15} /> Apply WFH
          </button>
        )}
      </div>

      {isHR && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}><Home /></div>
            <div className="stat-label">Today's WFH</div>
            <div className="stat-value">{todayCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'var(--warning-50)', color: 'var(--warning)' }}><Clock /></div>
            <div className="stat-label">Pending Requests</div>
            <div className="stat-value">{pendingCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'var(--success-50)', color: 'var(--success)' }}><CheckCircle /></div>
            <div className="stat-label">Approved</div>
            <div className="stat-value">{approvedCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}><XCircle /></div>
            <div className="stat-label">Rejected</div>
            <div className="stat-value">{rejectedCount}</div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
          <div className="table-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  {isHR && <th>Employee</th>}
                  <th>Date</th>
                  <th>Location & Tasks</th>
                  <th>Status</th>
                  {isHR && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    {isHR && (
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{r.person_name}</div>
                        <IDBadge code={r.person_code} label={r.person_type} size="sm" />
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}><Calendar size={14} style={{color:'var(--ink-light)'}}/> {r.date}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 4 }}>{r.expected_hours} hours</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink)' }}>
                        <MapPin size={12} style={{color:'var(--ink-light)'}}/> {r.working_address || 'Not specified'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 4 }}>{r.task_description}</div>
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-amber'}`}>
                        {r.status.toUpperCase()}
                      </span>
                      {r.reviewer_notes && <div style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 4, maxWidth: 200 }}>Note: {r.reviewer_notes}</div>}
                    </td>
                    {isHR && (
                      <td>
                        {r.status === 'pending' ? (
                          <div className="action-btns">
                            <button className="btn btn-sm btn-success" onClick={() => setRemarksModal({ open: true, type: 'approve', id: r.id, notes: '' })}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => setRemarksModal({ open: true, type: 'reject', id: r.id, notes: '' })}>
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        ) : <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>Reviewed by {r.reviewer_name}</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && <div className="empty-state"><Home size={44} /><p>No WFH requests found.</p></div>}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Apply for Work From Home"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => applyMutation.mutate(form)} disabled={applyMutation.isPending || !form.date}>
                {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-control" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expected Working Hours *</label>
              <input className="form-control" type="number" step="0.5" value={form.expected_hours} onChange={e => setForm({ ...form, expected_hours: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Working Address / City *</label>
              <input className="form-control" placeholder="e.g. Home, Bangalore" value={form.working_address} onChange={e => setForm({ ...form, working_address: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Task Description (What will you work on?) *</label>
            <textarea className="form-control" rows="3" placeholder="Describe the tasks you plan to complete..." value={form.task_description} onChange={e => setForm({ ...form, task_description: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reason for WFH *</label>
            <textarea className="form-control" rows="2" placeholder="Why are you requesting WFH?" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
        </Modal>
      )}

      {remarksModal.open && (
        <Modal
          title={remarksModal.type === 'approve' ? 'Approve WFH' : 'Reject WFH'}
          onClose={() => setRemarksModal({ open: false, type: '', id: null, notes: '' })}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setRemarksModal({ open: false, type: '', id: null, notes: '' })}>Cancel</button>
              <button className={`btn btn-${remarksModal.type === 'approve' ? 'success' : 'danger'}`} onClick={() => actionMutation.mutate(remarksModal)} disabled={actionMutation.isPending}>
                Confirm {remarksModal.type === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </>
          }
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Remarks (Optional)</label>
            <textarea className="form-control" rows="3" placeholder="Add any notes for the employee..." value={remarksModal.notes} onChange={e => setRemarksModal({ ...remarksModal, notes: e.target.value })} autoFocus />
          </div>
        </Modal>
      )}
    </div>
  )
}
