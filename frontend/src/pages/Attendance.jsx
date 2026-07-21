import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Search, Plus, CalendarDays, FileText, ChevronDown, Users, GraduationCap, MapPin, Briefcase, Coffee, UtensilsCrossed, Timer } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'paid', label: 'Paid Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'earned', label: 'Earned Leave' },
]

const BREAK_TYPES = [
  { value: 'personal_break', label: 'Personal Break' },
  { value: 'half_day', label: 'Half Day' },
]

const STATUS_BADGE = {
  pending:  'badge-amber',
  approved: 'badge-green',
  rejected: 'badge-red',
}

function LeaveForm({ isHR, onClose, onSuccess }) {
  const [form, setForm] = useState({
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
      await api.post('/attendance/leaves/', form)
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
      <div className="form-group">
        <label className="form-label">Leave Type *</label>
        <select className="form-control" value={form.leave_type} onChange={e => set('leave_type', e.target.value)} required>
          {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">From Date *</label>
          <input type="date" className="form-control" value={form.from_date} onChange={e => set('from_date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">To Date *</label>
          <input type="date" className="form-control" value={form.to_date} onChange={e => set('to_date', e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Reason *</label>
        <input type="text" className="form-control" placeholder="Brief reason for leave" value={form.reason} onChange={e => set('reason', e.target.value)} required />
      </div>
      <div className="form-group">
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

function BreakForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    break_type: 'personal_break',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.reason.trim()) { toast.error('Reason is required'); return }
    setSaving(true)
    try {
      await api.post('/attendance/breaks/', form)
      toast.success('Break request submitted')
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
      <div className="form-group">
        <label className="form-label">Break Type *</label>
        <select className="form-control" value={form.break_type} onChange={e => set('break_type', e.target.value)} required>
          {BREAK_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Date *</label>
        <input type="date" className="form-control" value={form.date} onChange={e => set('date', e.target.value)} required />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">From Time *</label>
          <input type="time" className="form-control" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">To Time *</label>
          <input type="time" className="form-control" value={form.end_time} onChange={e => set('end_time', e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Reason *</label>
        <textarea className="form-control" rows={3} placeholder="Explain the reason for your break request…" value={form.reason} onChange={e => set('reason', e.target.value)} style={{ resize: 'vertical' }} required />
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

function BreakCard({ breakReq, isHR, onApprove, onReject }) {
  const btype = BREAK_TYPES.find(b => b.value === breakReq.break_type)?.label || breakReq.break_type
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--amber-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Coffee size={18} style={{ color: 'var(--amber)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {isHR && <span style={{ fontWeight: 600, fontSize: 14 }}>{breakReq.person_name}</span>}
          {isHR && <span className={`badge ${breakReq.person_type === 'employee' ? 'badge-indigo' : 'badge-amber'}`} style={{ fontSize: 10 }}>{breakReq.person_type === 'employee' ? 'Employee' : 'Intern'}</span>}
          {isHR && <span style={{ fontSize: 12, color: 'var(--slate)' }}>—</span>}
          <span className={`badge ${breakReq.break_type === 'half_day' ? 'badge-indigo' : 'badge-amber'}`}>{btype}</span>
          <span className={`badge ${STATUS_BADGE[breakReq.status] || 'badge-gray'}`}>{breakReq.status}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 3 }}>
          {breakReq.date}
          {breakReq.start_time && breakReq.end_time && (
            <span style={{ marginLeft: 8 }}>{breakReq.start_time?.slice(0,5)} – {breakReq.end_time?.slice(0,5)}</span>
          )}
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>{breakReq.reason}</div>
        {breakReq.reviewer_notes && (
          <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, background: 'var(--paper)', fontSize: 12, color: 'var(--slate)' }}>
            <strong>HR note:</strong> {breakReq.reviewer_notes}
          </div>
        )}
      </div>
      {isHR && breakReq.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => onApprove(breakReq.id)}>Approve</button>
          <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => onReject(breakReq.id)}>Reject</button>
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
  const [tab, setTab] = useState('attendance') // 'attendance' | 'leaves' | 'breaks'
  const [leaveModal, setLeaveModal] = useState(false)
  const [breakModal, setBreakModal] = useState(false)
  const [leaveFilter, setLeaveFilter] = useState('all')
  const [breakFilter, setBreakFilter] = useState('all')

  const { data: todayAtt, isLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today/').then(r => r.data),
    enabled: isHR
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

  // Break requests query
  const { data: breaksData, isLoading: breaksLoading } = useQuery({
    queryKey: ['breaks', breakFilter],
    queryFn: () => {
      const params = breakFilter !== 'all' ? `?status=${breakFilter}` : ''
      return api.get(`/attendance/breaks/${params}`).then(r => r.data)
    }
  })

  // We should also check for approved WFH today for self-service
  const { data: wfhData } = useQuery({
    queryKey: ['wfh-today'],
    queryFn: () => api.get('/attendance/wfh/').then(r => r.data),
    enabled: !isHR
  })

  const checkinMutation = useMutation({
    mutationFn: (id) => api.post('/attendance/checkin/', { employee_id: id }),
    onSuccess: () => { qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['attendance-my-status']); toast.success('Logged in successfully!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to login')
  })
  const checkoutMutation = useMutation({
    mutationFn: (id) => api.post('/attendance/checkout/', { employee_id: id }),
    onSuccess: () => { qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['attendance-my-status']); toast.success('Logged out successfully!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to logout')
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
  const approveBreakMutation = useMutation({
    mutationFn: (id) => api.post(`/attendance/breaks/${id}/approve/`),
    onSuccess: () => { qc.invalidateQueries(['breaks']); toast.success('Break request approved') },
    onError: () => toast.error('Failed to approve')
  })
  const rejectBreakMutation = useMutation({
    mutationFn: (id) => api.post(`/attendance/breaks/${id}/reject/`),
    onSuccess: () => { qc.invalidateQueries(['breaks']); toast.success('Break request rejected') },
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
  const breaks = breaksData?.results || breaksData || []

  // Employee self-service view
  if (!isHR) {
    const myEmpId = user?.profile?.id
    const myAtt = myStatus

    // Check if WFH today
    const wfhRequests = wfhData?.results || wfhData || []
    const todayWfh = wfhRequests.find(r => r.status === 'approved' && r.date === new Date().toISOString().split('T')[0])
    
    // Progress calculation
    const shiftHours = todayWfh ? todayWfh.expected_hours : 8
    const workHours = myAtt?.work_hours || 0
    let currentHours = workHours
    if (myAtt?.check_in && !myAtt?.check_out) {
      const ms = new Date() - new Date(myAtt.check_in)
      currentHours = ms / (1000 * 60 * 60)
    }
    const progressPercent = Math.min((currentHours / shiftHours) * 100, 100)

    return (
      <div>
        <div className="page-header">
          <div><h2 className="page-header-title">My Attendance</h2><p className="page-header-sub">{new Date().toDateString()}</p></div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/wfh" className="btn btn-secondary"><Plus size={16} /> Apply WFH</Link>
            <button className="btn btn-primary" onClick={() => setLeaveModal(true)}><Plus size={16} /> Apply Leave</button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="segmented-tabs">
          {[
            { key: 'attendance', label: 'Today' },
            { key: 'leaves', label: 'My Leaves' },
            { key: 'breaks', label: 'Breaks' },
          ].map(t => (
            <button key={t.key} className={`segmented-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'attendance' && (
          <div className="attendance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 24, alignItems: 'start' }}>
            
            {/* Main Action Card */}
            <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 140, height: 140, borderRadius: '50%', 
                background: myAtt?.check_in ? (myAtt?.check_out ? 'var(--slate-100)' : 'var(--indigo-50)') : 'var(--paper)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                border: '4px solid', borderColor: myAtt?.check_in ? (myAtt?.check_out ? 'var(--slate-200)' : 'var(--indigo)') : 'var(--line)', 
                boxShadow: myAtt?.check_in && !myAtt?.check_out ? '0 0 30px rgba(37,99,235,0.15)' : 'none',
                position: 'relative'
              }}>
                <Clock size={48} style={{ color: myAtt?.check_in ? (myAtt?.check_out ? 'var(--slate-400)' : 'var(--indigo)') : 'var(--slate)' }} />
              </div>
              
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
                  {myAtt?.check_out ? 'Shift Completed' : myAtt?.check_in ? 'You are logged in' : 'Good Morning!'}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>
                  {myAtt?.check_out ? 'Great job today.' : myAtt?.check_in ? 'Have a productive day.' : 'Ready to start your day?'}
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', gap: 16, marginTop: 32 }}>
                {!myAtt?.check_in && (
                  <button className="btn btn-primary" style={{ flex: 1, padding: '16px', fontSize: 16, borderRadius: 'var(--radius-lg)' }} onClick={() => checkinMutation.mutate(myEmpId)} disabled={checkinMutation.isPending}>
                    {checkinMutation.isPending ? 'Logging in…' : 'Log In'}
                  </button>
                )}
                {myAtt?.check_in && !myAtt?.check_out && (
                  <button className="btn btn-amber" style={{ flex: 1, padding: '16px', fontSize: 16, borderRadius: 'var(--radius-lg)' }} onClick={() => checkoutMutation.mutate(myEmpId)} disabled={checkoutMutation.isPending}>
                    {checkoutMutation.isPending ? 'Logging out…' : 'Log Out'}
                  </button>
                )}
                {myAtt?.check_out && (
                  <button className="btn btn-ghost" style={{ flex: 1, padding: '16px', fontSize: 16, borderRadius: 'var(--radius-lg)' }} disabled>
                    Logged Out
                  </button>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0', color: 'var(--ink)' }}>Today's Summary</h3>
                <div className="form-row">
                  <div style={{ background: 'var(--paper)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--slate)', fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Clock size={16} /> Log In
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: myAtt?.check_in ? 'var(--ink)' : 'var(--slate)' }}>
                      {myAtt?.check_in ? new Date(myAtt.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--paper)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--slate)', fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <CheckCircle size={16} /> Log Out
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: myAtt?.check_out ? 'var(--ink)' : 'var(--slate)' }}>
                      {myAtt?.check_out ? new Date(myAtt.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    <span style={{ color: 'var(--slate)' }}>Working Hours</span>
                    <span style={{ color: 'var(--indigo)' }}>{currentHours.toFixed(1)} / {shiftHours}h</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--indigo-50)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--indigo)', width: `${progressPercent}%`, transition: 'width 0.5s ease-out' }} />
                  </div>
                </div>
              </div>

              {/* Fixed Break Schedule */}
              <div className="card break-schedule-card">
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Timer size={18} style={{ color: 'var(--amber)' }} /> Break Schedule
                </h3>
                <div className="break-schedule-list">
                  <div className="break-schedule-item">
                    <div className="break-schedule-icon" style={{ background: 'var(--amber-50)' }}>
                      <UtensilsCrossed size={16} style={{ color: 'var(--amber)' }} />
                    </div>
                    <div className="break-schedule-info">
                      <span className="break-schedule-name">Lunch Break</span>
                      <span className="break-schedule-time">1:00 PM – 2:00 PM</span>
                    </div>
                    <span className="badge badge-amber" style={{ fontSize: 10 }}>1 hour</span>
                  </div>
                  <div className="break-schedule-item">
                    <div className="break-schedule-icon" style={{ background: 'var(--green-50)' }}>
                      <Coffee size={16} style={{ color: '#047857' }} />
                    </div>
                    <div className="break-schedule-info">
                      <span className="break-schedule-name">Tea Break</span>
                      <span className="break-schedule-time">4:15 PM – 4:30 PM</span>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: 10 }}>15 min</span>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setTab('breaks'); setBreakModal(true) }}>
                    <Plus size={14} /> Request Break
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {tab === 'leaves' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
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

        {tab === 'breaks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div />
              <button className="btn btn-primary btn-sm" onClick={() => setBreakModal(true)}>
                <Plus size={14} /> Request Break
              </button>
            </div>

            {/* Fixed Break Schedule */}
            <div className="card break-schedule-card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Timer size={16} style={{ color: 'var(--amber)' }} /> Fixed Daily Breaks
              </h3>
              <div className="break-schedule-list">
                <div className="break-schedule-item">
                  <div className="break-schedule-icon" style={{ background: 'var(--amber-50)' }}>
                    <UtensilsCrossed size={16} style={{ color: 'var(--amber)' }} />
                  </div>
                  <div className="break-schedule-info">
                    <span className="break-schedule-name">Lunch Break</span>
                    <span className="break-schedule-time">1:00 PM – 2:00 PM</span>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: 10 }}>1 hour</span>
                </div>
                <div className="break-schedule-item">
                  <div className="break-schedule-icon" style={{ background: 'var(--green-50)' }}>
                    <Coffee size={16} style={{ color: '#047857' }} />
                  </div>
                  <div className="break-schedule-info">
                    <span className="break-schedule-name">Tea Break</span>
                    <span className="break-schedule-time">4:15 PM – 4:30 PM</span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>15 min</span>
                </div>
              </div>
            </div>

            {/* My Break Requests */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">My Break Requests</span>
                <select className="form-control" style={{ width: 'auto', fontSize: 13 }} value={breakFilter} onChange={e => setBreakFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {breaksLoading ? <div className="loading-center"><div className="spinner" /></div> : breaks.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate)', fontSize: 13 }}>No break requests yet.</div>
              ) : breaks.map(b => (
                <BreakCard key={b.id} breakReq={b} isHR={false} />
              ))}
            </div>
          </div>
        )}

        {leaveModal && (
          <Modal title="Apply for Leave" onClose={() => setLeaveModal(false)}>
            <LeaveForm isHR={false} onClose={() => setLeaveModal(false)} onSuccess={() => qc.invalidateQueries(['leaves'])} />
          </Modal>
        )}
        {breakModal && (
          <Modal title="Request Break" onClose={() => setBreakModal(false)}>
            <BreakForm onClose={() => setBreakModal(false)} onSuccess={() => qc.invalidateQueries(['breaks'])} />
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
      </div>

      {/* Tab switcher */}
      <div className="segmented-tabs">
        {[
          { key: 'attendance', label: "Today's Attendance" },
          { key: 'leaves', label: 'Leave Requests' },
          { key: 'breaks', label: 'Break Requests' },
        ].map(t => (
          <button key={t.key} className={`segmented-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'attendance' && (
        <>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card"><div className="stat-icon-wrap"><Users style={{ color: '#047857' }} size={22} /></div><div className="stat-label">Employees present</div><div className="stat-value">{presentEmployees}</div></div>
            <div className="stat-card"><div className="stat-icon-wrap"><Users style={{ color: 'var(--red)' }} size={22} /></div><div className="stat-label">Employees absent</div><div className="stat-value">{absentEmployees}</div></div>
            <div className="stat-card"><div className="stat-icon-wrap"><GraduationCap style={{ color: '#047857' }} size={22} /></div><div className="stat-label">Interns present</div><div className="stat-value">{presentInterns}</div></div>
            <div className="stat-card"><div className="stat-icon-wrap"><GraduationCap style={{ color: 'var(--red)' }} size={22} /></div><div className="stat-label">Interns absent</div><div className="stat-value">{absentInterns}</div></div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '24px 24px 20px', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="toolbar" style={{ flex: '1 1 280px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="search-wrap" style={{ flex: '1 1 200px' }}>
                  <Search className="search-icon" size={16} />
                  <input className="form-control" style={{ paddingLeft: 36, width: '100%' }} placeholder="Search employee or intern…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-control" style={{ flex: '0 0 auto', width: 'auto', minWidth: 120 }}>
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>This Week</option>
                </select>
              </div>
              <button className="btn btn-secondary" style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                <FileText size={15} /> Export CSV
              </button>
            </div>
            {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
              <ResponsiveTable
                headers={['Name', 'Type', 'Login Time', 'Logout Time', 'Hours', 'Status', '']}
                data={filteredRoster}
                renderRow={(person) => {
                  const att = today.find(a => (person.type === 'employee' ? a.employee === person.id : a.intern === person.id))
                  return (
                    <tr key={`${person.type}-${person.id}`}>
                      <td>
                        <div className="name-cell">
                          {person.picture
                            ? <img src={person.picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 0 0 1px var(--border)' }} />
                            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, border: '2px solid #fff', boxShadow: '0 0 0 1px var(--border)' }}>{person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                          }
                          <div><div className="name">{person.name}</div><div className="sub">{person.code}</div></div>
                        </div>
                      </td>
                      <td><span className={`badge ${person.type === 'employee' ? 'badge-indigo' : 'badge-amber'}`}>{person.type === 'employee' ? 'Employee' : 'Intern'}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{att?.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{att?.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{att?.work_hours ? `${att.work_hours}h` : '—'}</td>
                      <td><span className={`badge ${att ? 'badge-green' : 'badge-gray'}`}>{att ? att.status : 'Absent'}</span></td>
                      <td>
                        <button className="action-btn" title="View details"><Search size={14} /></button>
                      </td>
                    </tr>
                  )
                }}
                renderCard={(person) => {
                  const att = today.find(a => (person.type === 'employee' ? a.employee === person.id : a.intern === person.id))
                  return (
                    <MobileCard
                      key={`${person.type}-${person.id}`}
                      title={person.name}
                      subtitle={person.code}
                      avatar={
                        person.picture
                          ? <img src={person.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div className="avatar avatar-a" style={{ width: 32, height: 32, fontSize: 14 }}>{person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                      }
                      badges={
                        <>
                          <span className={`badge ${person.type === 'employee' ? 'badge-indigo' : 'badge-amber'}`}>{person.type === 'employee' ? 'Employee' : 'Intern'}</span>
                          <span className={`badge ${att ? 'badge-green' : 'badge-red'}`}>{att ? att.status : 'Absent'}</span>
                        </>
                      }
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, padding: 12, background: 'var(--surface)', borderRadius: 8, fontSize: 13 }}>
                        <div>
                          <div style={{ color: 'var(--ink-light)', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Login</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{att?.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--ink-light)', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Logout</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{att?.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ color: 'var(--ink-light)', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Total Hours</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{att?.work_hours ? `${att.work_hours}h` : '—'}</div>
                        </div>
                      </div>
                    </MobileCard>
                  )
                }}
              />
            )}
          </div>
        </>
      )}

      {tab === 'leaves' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
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

      {tab === 'breaks' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Break Requests</span>
            <select className="form-control" style={{ width: 'auto', fontSize: 13 }} value={breakFilter} onChange={e => setBreakFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {breaksLoading ? <div className="loading-center"><div className="spinner" /></div> : breaks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate)', fontSize: 13 }}>No break requests found.</div>
          ) : breaks.map(b => (
            <BreakCard
              key={b.id} breakReq={b} isHR={true}
              onApprove={(id) => approveBreakMutation.mutate(id)}
              onReject={(id) => rejectBreakMutation.mutate(id)}
            />
          ))}
        </div>
      )}

    </div>
  )
}
