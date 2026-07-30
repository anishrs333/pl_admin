import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from './Modal'
import Loading from './Loading'
import EmptyState from './EmptyState'

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function PayslipListModal({ person, type, onClose }) {
  const [downloading, setDownloading] = useState(null)
  const name = type === 'employee' ? person.full_name : person.name

  const queryParams = type === 'employee' ? `employee=${person.id}` : `intern=${person.id}`
  const { data, isLoading } = useQuery({
    queryKey: ['payslips', type, person.id],
    queryFn: () => api.get(`/payroll/?${queryParams}`).then(r => r.data)
  })

  const slips = data?.results || data || []

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

  return (
    <Modal title={`Payslips — ${name}`} onClose={onClose}>
      {isLoading ? <Loading /> : slips.length === 0 ? (
        <EmptyState icon={FileText} title="No payslips yet" description="No salary records found for this person." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--slate)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Period</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--slate)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--slate)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--slate)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Pay</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--slate)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--slate)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {slips.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-indigo">{MONTHS[s.month]} {s.year}</span></td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{Number(s.gross || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red)' }}>₹{Number(s.total_deductions || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: '#1F7A45' }}>₹{Number(s.net_salary || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px' }}><span className={`badge ${s.status === 'paid' ? 'badge-green' : 'badge-amber'}`}>{s.status}</span></td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => downloadSlip(s)} disabled={downloading === s.id}>
                      {downloading === s.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Download size={12} />} Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
