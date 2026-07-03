import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Search, Plus, CalendarDays, FileText, ChevronDown, Users, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'paid', label: 'Paid Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'earned', label: 'Earned Leave' },
]

const STATUS_BADGE = {
  pending:  'badge-amber',
  approved: 'badge-green',
  rejected: 'badge-red',
}

function LeaveForm({ employees = [], isHR, onClose, onSuccess }) {
  const [form, setForm] = useState({
    employee: '',
    leave_type: 'sick',
    from_date: '',
    to_date: '',
    reason: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.reason.trim()) { toast.error('Reason is required'); return }
    if (form.from_date > form.to_date) { toast.error('End date must be after start date'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!isHR) delete payload.employee
      await api.post('/attendance/leaves/', payload)
      toast.success('Leave request submitted')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {isHR && (
        <div>
          <label className="form-label">Employee *</label>
          <select className="form-control" value={form.employee} onChange={e => set('employee', e.target.value)} required>
            <option value="">Select employee…</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="form-label">Leave Type *</label>
        <select className="form-control" value={form.leave_type} onChange={e => set('leave_type', e.target.value)} required>
          {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label">From Date *</label>
          <input type="date" className="form-control" value={form.from_date} onChange={e => set('from_date', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">To Date *</label>
          <input type="date" className="form-control" value={form.to_date} onChange={e => set('to_date', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="form-label">Reason *</label>
        <input type="text" className="form-control" placeholder="Brief reason for leave" value={form.reason} onChange={e => set('reason', e.target.value)} required />
      </div>
      <div>
        <label className="form-label">Description <span style={{ color: 'var(--slate)', fontSize: 11 }}>(optional)</span></label>
        <textarea className="form-control" rows={3} placeholder="Any additional details…" value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</button>
      </div>
    </form>
  )
}

function LeaveCard({ leave, isHR, onApprove, onReject }) {
  const ltype = LEAVE_TYPES.find(l => l.value === leave.leave_type)?.label || leave.leave_type
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--indigo-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CalendarDays size={18} style={{ color: 'var(--indigo)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{isHR ? leave.employee_name : ltype}</span>
          {isHR && <span className={`badge ${leave.person_type === 'employee' ? 'badge-indigo' : 'badge-amber'}`} style={{ fontSize: 10 }}>{leave.person_type === 'employee' ? 'Employee' : 'Intern'}</span>}
          {isHR && <span style={{ fontSize: 12, color: 'var(--slate)' }}>— {ltype}</span>}
          <span className={`badge ${STATUS_BADGE[leave.status] || 'badge-gray'}`}>{leave.status}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 3 }}>
          {leave.from_date} → {leave.to_date} &middot; {leave.total_days} day{leave.total_days !== 1 ? 's' : ''}
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>{leave.reason}</div>
        {leave.description && <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 3, fontStyle: 'italic' }}>{leave.description}</div>}
        {leave.reviewer_notes && (
          <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, background: 'var(--paper)', fontSize: 12, color: 'var(--slate)' }}>
            <strong>HR note:</strong> {leave.reviewer_notes}
          </div>
        )}
      </div>
      {isHR && leave.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => onApprove(leave.id)}>Approve</button>
          <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => onReject(leave.id)}>Reject</button>
        </div>
      )}
    </div>
  )
}

export default function Attendance() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isHR = user?.role === 'hr'
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('attendance') // 'attendance' | 'leaves'
  const [leaveModal, setLeaveModal] = useState(false)
  const [leaveFilter, setLeaveFilter] = useState('all')

  const { data: todayAtt, isLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today/').then(r => r.data)
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
  const { data: myStatus } = useQuery({
    queryKey: ['attendance-my-status'],
    queryFn: () => api.get('/attendance/my_status/').then(r => r.data),
    enabled: !isHR
  })
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', leaveFilter],
    queryFn: () => {
      const params = leaveFilter !== 'all' ? `?status=${leaveFilter}` : ''
      return api.get(`/attendance/leaves/${params}`).then(r => r.data)
    }
  })

  const checkinMutation = useMutation({
    mutationFn: (id) => api.post('/attendance/checkin/', { employee_id: id }),
    onSuccess: () => { qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['attendance-my-status']); toast.success('Checked in!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to check in')
  })
  const checkoutMutation = useMutation({
    mutationFn: (id) => api.post('/attendance/checkout/', { employee_id: id }),
    onSuccess: () => { qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['attendance-my-status']); toast.success('Checked out!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to check out')
  })
  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/attendance/leaves/${id}/approve/`),
    onSuccess: () => { qc.invalidateQueries(['leaves']); toast.success('Leave approved') },
    onError: () => toast.error('Failed to approve')
  })
  const rejectMutation = useMutation({
    mutationFn: (id) => api.post(`/attendance/leaves/${id}/reject/`),
    onSuccess: () => { qc.invalidateQueries(['leaves']); toast.success('Leave rejected') },
    onError: () => toast.error('Failed to reject')
  })

  const employees = (emps?.results || emps || [])
  const internList = (interns?.results || interns || [])
  const roster = [
    ...employees.map(e => ({ id: e.id, type: 'employee', name: e.full_name, code: e.employee_id, picture: e.profile_picture_url })),
    ...internList.map(i => ({ id: i.id, type: 'intern', name: i.name, code: i.intern_id, picture: i.profile_picture_url })),
  ]
  const filteredRoster = roster.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const today = todayAtt || []
  const presentEmployees = today.filter(a => a.status === 'present' && a.employee).length
  const presentInterns = today.filter(a => a.status === 'present' && a.intern).length
  const absentEmployees = Math.max(employees.length - presentEmployees, 0)
  const absentInterns = Math.max(internList.length - presentInterns, 0)
  const leaves = leavesData?.results || leavesData || []

  // Employee self-service view
  if (!isHR) {
    const myEmpId = user?.profile?.id
    const myAtt = myStatus

    return (
      <div>
        <div className="page-header">
          <div><h2 className="page-header-title">My Attendance</h2><p className="page-header-sub">{new Date().toDateString()}</p></div>
          <button className="btn btn-primary" onClick={() => setLeaveModal(true)}><Plus size={16} /> Apply Leave</button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--paper)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
          {['attendance', 'leaves'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--slate)', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {t === 'attendance' ? 'Today' : 'My Leaves'}
            </button>
          ))}
        </div>

        {tab === 'attendance' && (
          <div className="card" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', padding: '24px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: myAtt?.check_in ? 'var(--green-50)' : 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid', borderColor: myAtt?.check_in ? '#86EFAC' : 'var(--border)' }}>
                <Clock size={30} style={{ color: myAtt?.check_in ? '#1F7A45' : 'var(--slate)' }} />
              </div>
              <div style={{ display: 'flex', gap: 40, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 4 }}>Check in</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700 }}>{myAtt?.check_in ? new Date(myAtt.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 4 }}>Check out</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700 }}>{myAtt?.check_out ? new Date(myAtt.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                </div>
              </div>
              {myAtt?.work_hours && (
                <div style={{ background: 'var(--green-50)', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#1F7A45' }}>
                  ✓ Worked {myAtt.work_hours}h today
                </div>
              )}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!myAtt?.check_in && (
                  <button className="btn btn-success" style={{ width: '100%' }} onClick={() => checkinMutation.mutate(myEmpId)} disabled={checkinMutation.isPending}>
                    {checkinMutation.isPending ? 'Checking in…' : '✓ Check In'}
                  </button>
                )}
                {myAtt?.check_in && !myAtt?.check_out && (
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => checkoutMutation.mutate(myEmpId)} disabled={checkoutMutation.isPending}>
                    {checkoutMutation.isPending ? 'Checking out…' : 'Check Out'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'leaves' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Leave Requests</span>
              <select className="form-control" style={{ width: 'auto', fontSize: 13 }} value={leaveFilter} onChange={e => setLeaveFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {leavesLoading ? <div className="loading-center"><div className="spinner" /></div> : leaves.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate)', fontSize: 13 }}>No leave requests yet.</div>
            ) : leaves.map(l => (
              <LeaveCard key={l.id} leave={l} isHR={false} />
            ))}
          </div>
        )}

        {leaveModal && (
          <Modal title="Apply for Leave" onClose={() => setLeaveModal(false)}>
            <LeaveForm isHR={false} onClose={() => setLeaveModal(false)} onSuccess={() => qc.invalidateQueries(['leaves'])} />
          </Modal>
        )}
      </div>
    )
  }

  // HR view
  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-header-title">Attendance</h2><p className="page-header-sub">{new Date().toDateString()}</p></div>
        <button className="btn btn-primary" onClick={() => setLeaveModal(true)}><Plus size={16} /> Add Leave</button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--paper)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {['attendance', 'leaves'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--slate)', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {t === 'attendance' ? 'Today\'s Attendance' : 'Leave Requests'}
          </button>
        ))}
      </div>

      {tab === 'attendance' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon-wrap" style={{ background: 'var(--green-50)' }}><Users style={{ color: '#1F7A45' }} size={19} /></div><div className="stat-label">Employees present</div><div className="stat-value">{presentEmployees}</div></div>
            <div className="stat-card"><div className="stat-icon-wrap" style={{ background: 'var(--red-50)' }}><Users style={{ color: 'var(--red)' }} size={19} /></div><div className="stat-label">Employees absent</div><div className="stat-value">{absentEmployees}</div></div>
            <div className="stat-card"><div className="stat-icon-wrap" style={{ background: 'var(--green-50)' }}><GraduationCap style={{ color: '#1F7A45' }} size={19} /></div><div className="stat-label">Interns present</div><div className="stat-value">{presentInterns}</div></div>
            <div className="stat-card"><div className="stat-icon-wrap" style={{ background: 'var(--red-50)' }}><GraduationCap style={{ color: 'var(--red)' }} size={19} /></div><div className="stat-label">Interns absent</div><div className="stat-value">{absentInterns}</div></div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '18px 22px 0' }}>
              <div className="search-wrap" style={{ marginBottom: 18 }}>
                <Search className="search-icon" size={16} />
                <input className="form-control" style={{ paddingLeft: 36, maxWidth: 300 }} placeholder="Search employee or intern…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
              <div className="table-wrap" style={{ margin: 0 }}>
                <table>
                  <thead><tr><th>Name</th><th>Type</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {filteredRoster.map(person => {
                      const att = today.find(a => (person.type === 'employee' ? a.employee === person.id : a.intern === person.id))
                      return (
                        <tr key={`${person.type}-${person.id}`}>
                          <td>
                            <div className="name-cell">
                              {person.picture
                                ? <img src={person.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                : <div className="avatar avatar-a">{person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                              }
                              <div><div className="name">{person.name}</div><div className="sub">{person.code}</div></div>
                            </div>
                          </td>
                          <td><span className={`badge ${person.type === 'employee' ? 'badge-indigo' : 'badge-amber'}`}>{person.type === 'employee' ? 'Employee' : 'Intern'}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{att?.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{att?.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{att?.work_hours ? `${att.work_hours}h` : '—'}</td>
                          <td><span className={`badge ${att ? 'badge-green' : 'badge-red'}`}>{att ? att.status : 'Absent'}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'leaves' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Leave Requests</span>
            <select className="form-control" style={{ width: 'auto', fontSize: 13 }} value={leaveFilter} onChange={e => setLeaveFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {leavesLoading ? <div className="loading-center"><div className="spinner" /></div> : leaves.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate)', fontSize: 13 }}>No leave requests found.</div>
          ) : leaves.map(l => (
            <LeaveCard
              key={l.id} leave={l} isHR={true}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {leaveModal && (
        <Modal title="Add Leave Request" onClose={() => setLeaveModal(false)}>
          <LeaveForm isHR={true} employees={employees} onClose={() => setLeaveModal(false)} onSuccess={() => qc.invalidateQueries(['leaves'])} />
        </Modal>
      )}
    </div>
  )
}
