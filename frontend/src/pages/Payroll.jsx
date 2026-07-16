import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign, CheckCircle, Download, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import IDBadge from '../components/IDBadge'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'
import { useAuth } from '../context/AuthContext'
import { useNotif } from '../context/NotificationContext'

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const emptyForm = { assignee: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic_salary: '', hra: '0', allowances: '0', incentives: '0', pf_deduction: '0', tax_deduction: '0', other_deductions: '0' }

export default function Payroll() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { fetchCount } = useNotif()
  const isHR = user?.role === 'hr'
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [downloading, setDownloading] = useState(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['payroll'], queryFn: () => api.get('/payroll/').then(r => r.data) })
  const { data: emps } = useQuery({ queryKey: ['employees-list'], queryFn: () => api.get('/employees/').then(r => r.data), enabled: isHR })
  const { data: interns } = useQuery({ queryKey: ['interns-list'], queryFn: () => api.get('/internships/').then(r => r.data), enabled: isHR })

  const saveMutation = useMutation({
    mutationFn: (d) => {
      const { assignee, ...rest } = d
      const payload = { ...rest, employee: null, intern: null }
      if (assignee) {
        const [type, id] = assignee.split(':')
        if (type === 'employee') payload.employee = id
        else if (type === 'intern') payload.intern = id
      }
      return api.post('/payroll/', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries(['payroll'])
      setModal(false)
      fetchCount()
      toast.success('Salary record created — notified')
    },
    onError: (e) => toast.error(e.response?.data?.non_field_errors?.[0] || JSON.stringify(e.response?.data) || 'Error saving')
  })

  const paidMutation = useMutation({
    mutationFn: (id) => api.post(`/payroll/${id}/mark_paid/`, { payment_ref: `TXN${String(id).padStart(6, '0')}` }),
    onSuccess: () => {
      qc.invalidateQueries(['payroll'])
      fetchCount()
      toast.success('Marked as paid — employee notified')
    }
  })

  const downloadSlip = async (salary) => {
    setDownloading(salary.id)
    try {
      const response = await api.get(`/payroll/${salary.id}/slip_pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Payslip_${salary.employee_code}_${MONTHS[salary.month]}_${salary.year}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download payslip')
    } finally {
      setDownloading(null)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const allSalaries = data?.results || data || []
  const employees = emps?.results || emps || []
  const internList = interns?.results || interns || []
  const salaries = allSalaries.filter(s =>
    !search || s.employee_name?.toLowerCase().includes(search.toLowerCase()) || s.employee_code?.toLowerCase().includes(search.toLowerCase())
  )
  const gross = (Number(form.basic_salary) || 0) + (Number(form.hra) || 0) + (Number(form.allowances) || 0) + (Number(form.incentives) || 0)
  const deductions = (Number(form.pf_deduction) || 0) + (Number(form.tax_deduction) || 0) + (Number(form.other_deductions) || 0)
  const netPreview = gross - deductions

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{isHR ? 'Payroll' : 'My Payslips'}</h2>
          <p className="page-header-sub">{isHR ? 'Salary records & payslip generation' : 'Download your monthly payslip'}</p>
        </div>
        {isHR && <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal(true) }}><Plus size={15} /> Add salary record</button>}
      </div>

      {isHR && (
        <div style={{ marginBottom: 16 }}>
          <div className="search-wrap" style={{ maxWidth: 320 }}>
            <Search className="search-icon" size={16} />
            <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search by employee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
          <ResponsiveTable
            headers={isHR ? ['Employee / Intern', 'Period', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Actions'] : ['Period', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Actions']}
            data={salaries}
            renderRow={(s) => (
              <tr key={s.id}>
                {isHR && (
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.employee_name}</div>
                    <IDBadge code={s.employee_code} label="" size="sm" />
                  </td>
                )}
                <td><span className="badge badge-indigo">{MONTHS[s.month]} {s.year}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{Number(s.gross || 0).toLocaleString('en-IN')}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red)' }}>₹{Number(s.total_deductions || 0).toLocaleString('en-IN')}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: '#1F7A45' }}>₹{Number(s.net_salary || 0).toLocaleString('en-IN')}</td>
                <td><span className={`badge ${s.status === 'paid' ? 'badge-green' : 'badge-amber'}`}>{s.status}</span></td>
                <td>
                  <div className="action-btns">
                    {isHR && s.status !== 'paid' && (
                      <button className="btn btn-sm btn-success" onClick={() => paidMutation.mutate(s.id)} disabled={paidMutation.isPending}>
                        <CheckCircle size={12} /> Mark Paid
                      </button>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => downloadSlip(s)} disabled={downloading === s.id}>
                      {downloading === s.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Download size={12} />} Slip
                    </button>
                  </div>
                </td>
              </tr>
            )}
            renderCard={(s) => (
              <MobileCard
                key={s.id}
                title={isHR ? s.employee_name : `${MONTHS[s.month]} ${s.year}`}
                subtitle={isHR ? <IDBadge code={s.employee_code} label="" size="sm" /> : `Net Pay: ₹${Number(s.net_salary || 0).toLocaleString('en-IN')}`}
                badges={
                  <>
                    {isHR && <span className="badge badge-indigo">{MONTHS[s.month]} {s.year}</span>}
                    <span className={`badge ${s.status === 'paid' ? 'badge-green' : 'badge-amber'}`}>{s.status}</span>
                  </>
                }
                actions={
                  <>
                    {isHR && s.status !== 'paid' && (
                      <button className="btn btn-sm btn-success" onClick={() => paidMutation.mutate(s.id)} disabled={paidMutation.isPending}>
                        <CheckCircle size={12} /> Mark Paid
                      </button>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => downloadSlip(s)} disabled={downloading === s.id}>
                      {downloading === s.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Download size={12} />} Slip
                    </button>
                  </>
                }
              />
            )}
          />
        )}
      </div>

      {isHR && modal && (
        <Modal
          title="Add salary record"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save & notify employee'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Employee or Intern *</label>
            <select className="form-control" value={form.assignee} onChange={e => set('assignee', e.target.value)} required>
              <option value="">Select employee or intern</option>
              <optgroup label="Employees">
                {employees.map(e => <option key={`employee:${e.id}`} value={`employee:${e.id}`}>{e.full_name} — {e.employee_id}</option>)}
              </optgroup>
              <optgroup label="Interns">
                {internList.map(i => <option key={`intern:${i.id}`} value={`intern:${i.id}`}>{i.name} — {i.intern_id}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Month</label>
              <select className="form-control" value={form.month} onChange={e => set('month', e.target.value)}>
                {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input className="form-control" type="number" value={form.year} onChange={e => set('year', e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 8px' }}>Earnings</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Basic Salary (₹) *</label><input className="form-control" type="number" value={form.basic_salary} onChange={e => set('basic_salary', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">HRA (₹)</label><input className="form-control" type="number" value={form.hra} onChange={e => set('hra', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Allowances (₹)</label><input className="form-control" type="number" value={form.allowances} onChange={e => set('allowances', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Incentive / Bonus (₹)</label><input className="form-control" type="number" value={form.incentives} onChange={e => set('incentives', e.target.value)} /></div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 8px' }}>Deductions</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Provident Fund (₹)</label><input className="form-control" type="number" value={form.pf_deduction} onChange={e => set('pf_deduction', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Income Tax (₹)</label><input className="form-control" type="number" value={form.tax_deduction} onChange={e => set('tax_deduction', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Other Deductions (₹)</label><input className="form-control" type="number" value={form.other_deductions} onChange={e => set('other_deductions', e.target.value)} /></div>

          <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: 600 }}>Net pay preview</span>
            <span style={{ color: '#fff', fontSize: 21, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{netPreview.toLocaleString('en-IN')}</span>
          </div>
        </Modal>
      )}
    </div>
  )
}
