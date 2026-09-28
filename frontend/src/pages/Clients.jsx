import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Briefcase, CheckCircle, CreditCard, Users } from 'lucide-react'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'

const emptyClientForm = { name: '', contact_person: '', email: '', mobile: '', address: '' }
const emptyProjectForm = { name: '', client: '', start_date: '', end_date: '', total_amount: '0', paid_amount: '0', status: 'active' }

export default function Clients() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [clientModal, setClientModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [editClientId, setEditClientId] = useState(null)
  const [editProjectId, setEditProjectId] = useState(null)
  const [paymentProject, setPaymentProject] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get(`/clients/?search=${encodeURIComponent(search)}`).then(r => r.data)
  })

  const saveClientMutation = useMutation({
    mutationFn: (d) => editClientId ? api.patch(`/clients/${editClientId}/`, d) : api.post('/clients/', d),
    onSuccess: () => {
      qc.invalidateQueries(['clients'])
      setClientModal(false)
      setClientForm(emptyClientForm)
      setEditClientId(null)
      toast.success(editClientId ? 'Client updated' : 'Client added')
    },
    onError: (e) => {
      const d = e.response?.data
      if (d?.detail) toast.error(d.detail)
      else if (d && typeof d === 'object') {
        const firstKey = Object.keys(d)[0]
        const firstErr = Array.isArray(d[firstKey]) ? d[firstKey][0] : d[firstKey]
        toast.error(`${firstKey.replace('_', ' ')}: ${firstErr}`)
      } else {
        toast.error('Error saving client')
      }
    }
  })

  const deleteClientMutation = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['clients']); toast.success('Client removed') }
  })

  const saveProjectMutation = useMutation({
    mutationFn: (d) => {
      const payload = { ...d, total_amount: Number(d.total_amount) || 0, paid_amount: Number(d.paid_amount) || 0 }
      return editProjectId ? api.patch(`/clients/projects/${editProjectId}/`, payload) : api.post('/clients/projects/', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries(['clients'])
      setProjectModal(false)
      setProjectForm(emptyProjectForm)
      setEditProjectId(null)
      toast.success(editProjectId ? 'Project updated' : 'Project added')
    },
    onError: (e) => {
      const data = e.response?.data
      if (data?.non_field_errors) toast.error(data.non_field_errors[0])
      else if (data?.paid_amount) toast.error(Array.isArray(data.paid_amount) ? data.paid_amount[0] : data.paid_amount)
      else if (data?.client) toast.error(Array.isArray(data.client) ? data.client[0] : data.client)
      else if (data?.name) toast.error(Array.isArray(data.name) ? data.name[0] : data.name)
      else if (data?.start_date) toast.error(Array.isArray(data.start_date) ? data.start_date[0] : data.start_date)
      else if (data?.detail) toast.error(data.detail)
      else {
        const firstKey = data ? Object.keys(data)[0] : null
        if (firstKey) toast.error(`${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`)
        else toast.error('Error saving project')
      }
    }
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => api.delete(`/clients/projects/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['clients']); toast.success('Project removed') }
  })

  const markClearedMutation = useMutation({
    mutationFn: (id) => api.post(`/clients/projects/${id}/mark_cleared/`),
    onSuccess: () => { qc.invalidateQueries(['clients']); toast.success('Project marked as fully paid') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error')
  })

  const addPaymentMutation = useMutation({
    mutationFn: ({ id, amount }) => api.post(`/clients/projects/${id}/add_payment/`, { amount }),
    onSuccess: () => {
      qc.invalidateQueries(['clients'])
      setPaymentModal(false)
      setPaymentProject(null)
      setPaymentAmount('')
      toast.success('Payment recorded')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error recording payment')
  })

  const setClient = (k, v) => setClientForm(f => ({ ...f, [k]: v }))
  const setProject = (k, v) => setProjectForm(f => ({ ...f, [k]: v }))

  const clients = data?.results || data || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Clients</h2>
          <p className="page-header-sub">{clients.length} on record</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setProjectForm(emptyProjectForm); setEditProjectId(null); setProjectModal(true) }}><Briefcase size={15} /> Add project</button>
          <button className="btn btn-primary" onClick={() => { setClientForm(emptyClientForm); setEditClientId(null); setClientModal(true) }}><Plus size={15} /> Add client</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-header-mobile">
          <div className="search-wrap" style={{ marginBottom: 18 }}>
            <Search className="search-icon" size={16} />
            <input className="form-control" style={{ paddingLeft: 36, width: '100%' }} placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? <Loading /> : (
          clients.length === 0 ? <EmptyState icon={Users} title="No clients yet" description="Add your first client to get started." /> :
          <ResponsiveTable
            headers={['Client', 'Contact', 'Email', 'Mobile', 'Actions']}
            data={clients}
            renderRow={(c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ fontSize: 13 }}>{c.contact_person}</td>
                <td style={{ fontSize: 13 }}>{c.email}</td>
                <td style={{ fontSize: 13 }}>{c.mobile}</td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn" onClick={() => { setClientForm(c); setEditClientId(c.id); setClientModal(true) }}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove?')) deleteClientMutation.mutate(c.id) }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            )}
            renderCard={(c) => (
              <MobileCard
                key={c.id}
                title={c.name}
                subtitle={c.email}
                badges={
                  <>
                    <span className="badge badge-gray">{c.contact_person}</span>
                    <span className="badge badge-gray">{c.mobile}</span>
                  </>
                }
                actions={
                  <>
                    <button className="action-btn" onClick={() => { setClientForm(c); setEditClientId(c.id); setClientModal(true) }}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove?')) deleteClientMutation.mutate(c.id) }}><Trash2 size={13} /> Delete</button>
                  </>
                }
              />
            )}
          />
        )}
      </div>

      {clients.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>All Projects</h3>
          <ResponsiveTable
            headers={['Project', 'Client', 'Total', 'Paid', 'Balance', 'Status', 'Progress', 'Actions']}
            data={clients.flatMap(c => (c.projects || []).map(p => ({ ...p, client_name: c.name, client_id: c.id })))}
            renderRow={(p) => {
              const total = Number(p.total_amount) || 0
              const paid = Number(p.paid_amount) || 0
              const balance = total - paid
              const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
              const isCleared = balance <= 0
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                  <td style={{ fontSize: 13 }}>{p.client_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{'\u20B9'}{total.toLocaleString('en-IN')}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#1F7A45' }}>{'\u20B9'}{paid.toLocaleString('en-IN')}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: isCleared ? '#1F7A45' : 'var(--red)' }}>{'\u20B9'}{balance.toLocaleString('en-IN')}</td>
                  <td>
                    {isCleared ? (
                      <span className="badge badge-green"><CheckCircle size={11} /> Cleared</span>
                    ) : (
                      <span className="badge badge-amber">Pending</span>
                    )}
                  </td>
                  <td style={{ minWidth: 100 }}>
                    <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ background: pct === 100 ? '#1F7A45' : 'var(--indigo)', height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--slate)', marginTop: 2 }}>{pct}%</div>
                  </td>
                  <td>
                    <div className="action-btns">
                      {!isCleared && (
                        <button className="action-btn" title="Record Payment" onClick={() => { setPaymentProject(p); setPaymentAmount(''); setPaymentModal(true) }}><CreditCard size={13} /> Pay</button>
                      )}
                      {!isCleared && (
                        <button className="action-btn" title="Mark as Fully Paid" onClick={() => { if (window.confirm(`Mark "${p.name}" as fully paid?`)) markClearedMutation.mutate(p.id) }}><CheckCircle size={13} /> Clear</button>
                      )}
                      <button className="action-btn" onClick={() => { setProjectForm(p); setEditProjectId(p.id); setProjectModal(true) }}><Edit2 size={13} /></button>
                      <button className="action-btn" onClick={() => { if (window.confirm('Remove project?')) deleteProjectMutation.mutate(p.id) }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            }}
            renderCard={(p) => {
              const total = Number(p.total_amount) || 0
              const paid = Number(p.paid_amount) || 0
              const balance = total - paid
              const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
              const isCleared = balance <= 0
              return (
                <MobileCard
                  key={p.id}
                  title={p.name}
                  subtitle={p.client_name}
                  badges={
                    <>
                      <span className="badge badge-indigo">{'\u20B9'}{total.toLocaleString('en-IN')}</span>
                      <span className="badge badge-green">{'\u20B9'}{paid.toLocaleString('en-IN')} paid</span>
                      {isCleared ? (
                        <span className="badge badge-green"><CheckCircle size={11} /> Cleared</span>
                      ) : (
                        <span className="badge badge-red">{'\u20B9'}{balance.toLocaleString('en-IN')} balance</span>
                      )}
                    </>
                  }
                  actions={
                    <>
                      {!isCleared && (
                        <button className="action-btn" onClick={() => { setPaymentProject(p); setPaymentAmount(''); setPaymentModal(true) }}><CreditCard size={13} /> Record Payment</button>
                      )}
                      {!isCleared && (
                        <button className="action-btn" onClick={() => { if (window.confirm(`Mark "${p.name}" as fully paid?`)) markClearedMutation.mutate(p.id) }}><CheckCircle size={13} /> Mark Cleared</button>
                      )}
                      <button className="action-btn" onClick={() => { setProjectForm(p); setEditProjectId(p.id); setProjectModal(true) }}><Edit2 size={13} /> Edit</button>
                      <button className="action-btn" onClick={() => { if (window.confirm('Remove project?')) deleteProjectMutation.mutate(p.id) }}><Trash2 size={13} /> Delete</button>
                    </>
                  }
                />
              )
            }}
          />
        </div>
      )}

      {clientModal && (
        <Modal
          title={editClientId ? 'Edit client' : 'Add client'}
          onClose={() => { setClientModal(false); setClientForm(emptyClientForm); setEditClientId(null) }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setClientModal(false); setClientForm(emptyClientForm); setEditClientId(null) }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveClientMutation.mutate(clientForm)} disabled={saveClientMutation.isPending}>
                {saveClientMutation.isPending ? 'Saving…' : 'Save client'}
              </button>
            </>
          }
        >
          <div className="form-group"><label className="form-label">Client name *</label><input className="form-control" value={clientForm.name} onChange={e => setClient('name', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Contact person *</label><input className="form-control" value={clientForm.contact_person} onChange={e => setClient('contact_person', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={clientForm.email} onChange={e => setClient('email', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Mobile *</label><input className="form-control" value={clientForm.mobile} onChange={e => setClient('mobile', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Address</label><textarea className="form-control" rows={2} value={clientForm.address} onChange={e => setClient('address', e.target.value)} /></div>
        </Modal>
      )}

      {projectModal && (
        <Modal
          title={editProjectId ? 'Edit project' : 'Add project'}
          onClose={() => { setProjectModal(false); setProjectForm(emptyProjectForm); setEditProjectId(null) }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setProjectModal(false); setProjectForm(emptyProjectForm); setEditProjectId(null) }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveProjectMutation.mutate(projectForm)} disabled={saveProjectMutation.isPending}>
                {saveProjectMutation.isPending ? 'Saving…' : 'Save project'}
              </button>
            </>
          }
        >
          <div className="form-group"><label className="form-label">Project name *</label><input className="form-control" value={projectForm.name} onChange={e => setProject('name', e.target.value)} /></div>
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select className="form-control" value={projectForm.client} onChange={e => setProject('client', e.target.value)}>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Start date *</label><input className="form-control" type="date" value={projectForm.start_date} onChange={e => setProject('start_date', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">End date</label><input className="form-control" type="date" value={projectForm.end_date || ''} onChange={e => setProject('end_date', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Total Amount (₹) *</label><input className="form-control" type="number" min="0" value={projectForm.total_amount} onChange={e => setProject('total_amount', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Paid Amount (₹) *</label><input className="form-control" type="number" min="0" value={projectForm.paid_amount} onChange={e => {
              const val = e.target.value
              setProject('paid_amount', val)
            }} /></div>
          </div>
          {Number(projectForm.paid_amount) > Number(projectForm.total_amount) && (
            <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>Paid amount cannot exceed total amount.</div>
          )}
          <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: 600 }}>Balance Amount</span>
            <span style={{ color: '#fff', fontSize: 21, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{'\u20B9'}{((Number(projectForm.total_amount) || 0) - (Number(projectForm.paid_amount) || 0)).toLocaleString('en-IN')}</span>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Status</label>
            <select className="form-control" value={projectForm.status} onChange={e => setProject('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </Modal>
      )}

      {paymentModal && paymentProject && (
        <Modal
          title="Record Payment"
          onClose={() => { setPaymentModal(false); setPaymentProject(null); setPaymentAmount('') }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setPaymentModal(false); setPaymentProject(null); setPaymentAmount('') }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                const amt = Number(paymentAmount)
                if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
                const remaining = Number(paymentProject.total_amount) - Number(paymentProject.paid_amount)
                if (amt > remaining) { toast.error(`Amount exceeds remaining balance of ₹${remaining.toLocaleString('en-IN')}`); return }
                addPaymentMutation.mutate({ id: paymentProject.id, amount: amt })
              }} disabled={addPaymentMutation.isPending}>
                {addPaymentMutation.isPending ? 'Recording…' : 'Record Payment'}
              </button>
            </>
          }
        >
          <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 }}>{paymentProject.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Remaining Balance</span>
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {'\u20B9'}{(Number(paymentProject.total_amount) - Number(paymentProject.paid_amount)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input className="form-control" type="text" inputMode="numeric" pattern="[0-9]*" value={paymentAmount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setPaymentAmount(v) }} placeholder="Enter amount" autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[1000, 2000, 5000].map(quick => {
              const remaining = Number(paymentProject.total_amount) - Number(paymentProject.paid_amount)
              const disabled = quick > remaining
              return (
                <button key={quick} className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px', opacity: disabled ? 0.4 : 1 }} disabled={disabled} onClick={() => setPaymentAmount(String(quick))}>
                  {'\u20B9'}{quick.toLocaleString('en-IN')}
                </button>
              )
            })}
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setPaymentAmount(String(Number(paymentProject.total_amount) - Number(paymentProject.paid_amount)))}>
              Full Balance
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
