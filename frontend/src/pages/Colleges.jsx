import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Building2, Phone, PhoneOff, GraduationCap } from 'lucide-react'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'

const emptyForm = { name: '', contact_person: '', mobile: '', email: '', address: '', status: 'not_updated', call_status: 'not_called', last_called_date: '', follow_up_notes: '' }
const statusColors = { updated: 'badge-green', not_updated: 'badge-gray' }
const callColors = { called: 'badge-indigo', not_called: 'badge-amber' }

export default function Colleges() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [callFilter, setCallFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['colleges', search],
    queryFn: () => api.get(`/colleges/?search=${encodeURIComponent(search)}`).then(r => r.data)
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editId ? api.patch(`/colleges/${editId}/`, d) : api.post('/colleges/', d),
    onSuccess: () => {
      qc.invalidateQueries(['colleges'])
      closeModal()
      toast.success(editId ? 'College updated' : 'College added')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error saving')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/colleges/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['colleges']); toast.success('College removed') }
  })

  const toggleCalledMutation = useMutation({
    mutationFn: (id) => api.post(`/colleges/${id}/toggle_called/`),
    onSuccess: (res) => {
      qc.invalidateQueries(['colleges'])
      toast.success(res.data.call_status === 'called' ? 'Marked as Called' : 'Marked as Not Called')
    },
    onError: () => toast.error('Failed to update call status')
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => api.post(`/colleges/${id}/toggle_status/`),
    onSuccess: (res) => {
      qc.invalidateQueries(['colleges'])
      toast.success(res.data.status === 'updated' ? 'Marked as Updated' : 'Marked as Not Updated')
    },
    onError: () => toast.error('Failed to update status')
  })

  const closeModal = () => {
    setModal(false)
    setForm(emptyForm)
    setEditId(null)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const allColleges = data?.results || data || []
  const colleges = allColleges.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    if (callFilter && c.call_status !== callFilter) return false
    return true
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Colleges</h2>
          <p className="page-header-sub">{colleges.length} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setModal(true) }}><Plus size={15} /> Add college</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-header-mobile">
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ flex: '1 1 240px' }}>
              <Search className="search-icon" size={16} />
              <input className="form-control" style={{ paddingLeft: 36, width: '100%' }} placeholder="Search colleges…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="updated">Updated</option>
              <option value="not_updated">Not Updated</option>
            </select>
            <select className="form-control" style={{ width: 140 }} value={callFilter} onChange={e => setCallFilter(e.target.value)}>
              <option value="">All Call Status</option>
              <option value="called">Called</option>
              <option value="not_called">Not Called</option>
            </select>
          </div>
        </div>

        {isLoading ? <Loading /> : (
          colleges.length === 0 ? <EmptyState icon={GraduationCap} title="No colleges yet" description="Add your first college to get started." /> :
          <ResponsiveTable
            headers={['College', 'Contact', 'Mobile', 'Email', 'Status', 'Call Status', 'Actions']}
            data={colleges}
            renderRow={(c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ fontSize: 13 }}>{c.contact_person}</td>
                <td style={{ fontSize: 13 }}>{c.mobile}</td>
                <td style={{ fontSize: 13 }}>{c.email || '—'}</td>
                <td>
                  <button
                    className={`badge ${statusColors[c.status] || 'badge-gray'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    onClick={() => toggleStatusMutation.mutate(c.id)}
                    title={`Click to mark as ${c.status === 'updated' ? 'Not Updated' : 'Updated'}`}
                  >
                    {c.status === 'updated' ? 'Updated' : 'Not Updated'}
                  </button>
                </td>
                <td>
                  <button
                    className={`badge ${callColors[c.call_status] || 'badge-gray'}`}
                    style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => toggleCalledMutation.mutate(c.id)}
                    title={`Click to mark as ${c.call_status === 'called' ? 'Not Called' : 'Called'}`}
                  >
                    {c.call_status === 'called' ? <Phone size={11} /> : <PhoneOff size={11} />}
                    {c.call_status === 'called' ? 'Called' : 'Not Called'}
                  </button>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn" onClick={() => { setForm(c); setEditId(c.id); setModal(true) }}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove?')) deleteMutation.mutate(c.id) }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            )}
            renderCard={(c) => (
              <MobileCard
                key={c.id}
                title={c.name}
                subtitle={c.email || '—'}
                badges={
                  <>
                    <span className="badge badge-gray">{c.contact_person}</span>
                    <span className={`badge ${statusColors[c.status] || 'badge-gray'}`}>{c.status === 'updated' ? 'Updated' : 'Not Updated'}</span>
                    <button
                      className={`badge ${callColors[c.call_status] || 'badge-gray'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => toggleCalledMutation.mutate(c.id)}
                    >
                      {c.call_status === 'called' ? 'Called' : 'Not Called'}
                    </button>
                  </>
                }
                actions={
                  <>
                    <button className="action-btn" onClick={() => { setForm(c); setEditId(c.id); setModal(true) }}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove?')) deleteMutation.mutate(c.id) }}><Trash2 size={13} /> Delete</button>
                  </>
                }
              />
            )}
          />
        )}
      </div>

      {modal && (
        <Modal
          title={editId ? 'Edit college' : 'Add college'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save college'}
              </button>
            </>
          }
        >
          <div className="form-group"><label className="form-label">College name *</label><input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Contact person *</label><input className="form-control" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Mobile *</label><input className="form-control" value={form.mobile} onChange={e => set('mobile', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status || 'not_updated'} onChange={e => set('status', e.target.value)}>
                <option value="updated">Updated</option>
                <option value="not_updated">Not Updated</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Call Status</label>
              <select className="form-control" value={form.call_status || 'not_called'} onChange={e => {
                const val = e.target.value
                set('call_status', val)
                if (val === 'called' && !form.last_called_date) {
                  set('last_called_date', new Date().toISOString().split('T')[0])
                } else if (val === 'not_called') {
                  set('last_called_date', '')
                }
              }}>
                <option value="called">Called</option>
                <option value="not_called">Not Called</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Last Called Date</label><input className="form-control" type="date" value={form.last_called_date || ''} onChange={e => set('last_called_date', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Follow-up Notes</label><textarea className="form-control" rows={2} value={form.follow_up_notes || ''} onChange={e => set('follow_up_notes', e.target.value)} placeholder="Any notes about follow-up…" /></div>
          <div className="form-group"><label className="form-label">Address</label><textarea className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></div>
        </Modal>
      )}
    </div>
  )
}
