import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from './Modal'

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const now = new Date()
const emptyForm = {
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  basic_salary: '',
  hra: '0',
  allowances: '0',
  incentives: '0',
  pf_deduction: '0',
  tax_deduction: '0',
  other_deductions: '0',
  leaves_taken: '0',
  lop_days: '0',
  leave_deduction: '0',
  per_day_salary: '0',
}

export default function SendPayslipModal({ person, type, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!person?.id) return
    const fetchLeaveSummary = async () => {
      try {
        const res = await api.get('/payroll/leave-summary/', {
          params: {
            [type]: person.id,
            month: form.month,
            year: form.year
          }
        })
        const { total_leaves, lop_days, leave_deduction, per_day_salary, base_salary } = res.data
        setForm(f => ({
          ...f,
          basic_salary: String(base_salary || f.basic_salary || person.salary || person.stipend_amount || 0),
          leaves_taken: String(total_leaves || 0),
          lop_days: String(lop_days || 0),
          leave_deduction: String(leave_deduction || 0),
          per_day_salary: String(per_day_salary || 0)
        }))
      } catch (e) {
        console.error('Failed to fetch leave summary', e)
      }
    }
    fetchLeaveSummary()
  }, [form.month, form.year, person.id, type])

  const handleBasicSalaryChange = (val) => {
    const basic = Number(val) || 0
    const lop = Number(form.lop_days) || 0
    const perDay = basic / 30
    const ded = perDay * lop
    setForm(f => ({
      ...f,
      basic_salary: val,
      per_day_salary: perDay.toFixed(2),
      leave_deduction: ded.toFixed(2)
    }))
  }

  const handleLopDaysChange = (val) => {
    const lop = Number(val) || 0
    const basic = Number(form.basic_salary) || 0
    const perDay = basic / 30
    const ded = perDay * lop
    setForm(f => ({
      ...f,
      lop_days: val,
      leave_deduction: ded.toFixed(2)
    }))
  }

  const gross = (Number(form.basic_salary) || 0) + (Number(form.hra) || 0) + (Number(form.allowances) || 0) + (Number(form.incentives) || 0)
  const deductions = (Number(form.pf_deduction) || 0) + (Number(form.tax_deduction) || 0) + (Number(form.other_deductions) || 0) + (Number(form.leave_deduction) || 0)
  const netPreview = gross - deductions

  const sendMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        employee: type === 'employee' ? person.id : null,
        intern: type === 'intern' ? person.id : null,
      }
      return api.post('/payroll/create-and-send/', payload)
    },
    onSuccess: (res) => {
      qc.invalidateQueries(['payroll'])
      qc.invalidateQueries(['employees'])
      qc.invalidateQueries(['internships'])
      toast.success(res.data?.detail || 'Payslip sent successfully')
      onClose()
    },
    onError: (e) => {
      const data = e.response?.data
      const msg = data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data) || 'Failed to send payslip'
      toast.error(msg)
    }
  })

  const name = type === 'employee' ? person.full_name : person.name
  const email = person.email

  return (
    <Modal
      title={`Send Payslip — ${name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !form.basic_salary}>
            {sendMutation.isPending ? <><Loader2 size={14} className="spin-icon" /> Generating…</> : <><Send size={14} /> Generate & Send</>}
          </button>
        </>
      }
    >
      <div style={{ background: 'var(--indigo-50)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--indigo-deep)', marginBottom: 16 }}>
        Payslip will be created and <strong>{name}</strong> will be notified in-app.
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Month *</label>
          <select className="form-control" value={form.month} onChange={e => set('month', Number(e.target.value))}>
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Year *</label>
          <input className="form-control" type="text" value={form.year} onChange={e => set('year', e.target.value)} />
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 8px' }}>Earnings</div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Basic Salary (₹) *</label><input className="form-control" type="text" value={form.basic_salary} onChange={e => handleBasicSalaryChange(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">HRA (₹)</label><input className="form-control" type="text" value={form.hra} onChange={e => set('hra', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Allowances (₹)</label><input className="form-control" type="text" value={form.allowances} onChange={e => set('allowances', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Incentive / Bonus (₹)</label><input className="form-control" type="text" value={form.incentives} onChange={e => set('incentives', e.target.value)} /></div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 8px' }}>Deductions</div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Provident Fund (₹)</label><input className="form-control" type="text" value={form.pf_deduction} onChange={e => set('pf_deduction', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Income Tax (₹)</label><input className="form-control" type="text" value={form.tax_deduction} onChange={e => set('tax_deduction', e.target.value)} /></div>
      </div>
      <div className="form-group"><label className="form-label">Other Deductions (₹)</label><input className="form-control" type="text" value={form.other_deductions} onChange={e => set('other_deductions', e.target.value)} /></div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 8px' }}>Leave & LOP Details</div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Leaves Taken (days)</label><input className="form-control" type="text" value={form.leaves_taken} onChange={e => set('leaves_taken', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">LOP Days (Loss of Pay)</label><input className="form-control" type="text" value={form.lop_days} onChange={e => handleLopDaysChange(e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Per Day Salary (₹)</label><input className="form-control" type="text" value={form.per_day_salary} readOnly disabled /></div>
        <div className="form-group"><label className="form-label">Leave Deduction (₹)</label><input className="form-control" type="text" value={form.leave_deduction} onChange={e => set('leave_deduction', e.target.value)} /></div>
      </div>

      <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: 600 }}>Net pay preview</span>
        <span style={{ color: '#fff', fontSize: 21, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{netPreview.toLocaleString('en-IN')}</span>
      </div>
    </Modal>
  )
}
