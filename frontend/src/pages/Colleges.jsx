import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'

const emptyForm = { name: '', contact_person: '', mobile: '', email: '', address: '' }

export default function Colleges() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

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

  const closeModal = () => {
    setModal(false)
    setForm(emptyForm)
    setEditId(null)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const colleges = data?.results || data || []

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
        <div style={{ padding: '18px 22px 0' }}>
          <div className="search-wrap" style={{ marginBottom: 18 }}>
            <Search className="search-icon" size={16} />
            <input className="form-control" style={{ paddingLeft: 36, width: '100%', maxWidth: 320 }} placeholder="Search colleges…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
          <ResponsiveTable
            headers={['College', 'Contact', 'Mobile', 'Email', 'Actions']}
            data={colleges}
            renderRow={(c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ fontSize: 13 }}>{c.contact_person}</td>
                <td style={{ fontSize: 13 }}>{c.mobile}</td>
                <td style={{ fontSize: 13 }}>{c.email || '—'}</td>
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
                    <span className="badge badge-gray">{c.mobile}</span>
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
          </div>
          <div className="form-group"><label className="form-label">Address</label><textarea className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></div>
        </Modal>
      )}
    </div>
  )
}
