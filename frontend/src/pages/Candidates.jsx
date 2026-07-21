import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, UserSearch } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import ResponsiveTable from '../components/ResponsiveTable'
import MobileCard from '../components/MobileCard'

const statusBadge = { applied: 'badge-indigo', shortlisted: 'badge-amber', rejected: 'badge-red', hired: 'badge-green' }
const emptyForm = { first_name: '', last_name: '', email: '', mobile: '', college_name: '', position_applied: '', cover_letter: '' }

export default function Candidates() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', search],
    queryFn: () => api.get(`/candidates/?search=${encodeURIComponent(search)}`).then(r => r.data)
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editId ? api.patch(`/candidates/${editId}/`, d) : api.post('/candidates/', d),
    onSuccess: () => {
      qc.invalidateQueries(['candidates'])
      closeModal()
      toast.success(editId ? 'Candidate updated' : 'Candidate added')
    },
    onError: (e) => toast.error(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Error saving')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/candidates/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['candidates']); toast.success('Candidate removed') }
  })

  const closeModal = () => {
    setModal(false)
    setForm(emptyForm)
    setEditId(null)
  }

  const openEdit = (cand) => {
    setForm(cand)
    setEditId(cand.id)
    setModal(true)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const candidates = data?.results || data || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Candidates</h2>
          <p className="page-header-sub">{candidates.length} in pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setModal(true) }}><Plus size={15} /> Add candidate</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 22px 0' }}>
          <div className="search-wrap" style={{ marginBottom: 18 }}>
            <Search className="search-icon" size={16} />
            <input className="form-control" style={{ paddingLeft: 36, width: '100%', maxWidth: 320 }} placeholder="Search candidates…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? <div className="loading-center"><div className="spinner" /></div> : (
          <ResponsiveTable
            headers={['Candidate', 'Email', 'Position', 'College', 'Status', 'Actions']}
            data={candidates}
            renderRow={(cand) => (
              <tr key={cand.id}>
                <td style={{ fontWeight: 600 }}>{cand.first_name} {cand.last_name}</td>
                <td style={{ fontSize: 13 }}>{cand.email}</td>
                <td style={{ fontSize: 13 }}>{cand.position_applied || '—'}</td>
                <td style={{ fontSize: 13 }}>{cand.college_name || '—'}</td>
                <td><span className={`badge ${statusBadge[cand.status] || 'badge-gray'}`}>{cand.status}</span></td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn" onClick={() => openEdit(cand)}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove candidate?')) deleteMutation.mutate(cand.id) }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            )}
            renderCard={(cand) => (
              <MobileCard
                key={cand.id}
                title={`${cand.first_name} ${cand.last_name}`}
                subtitle={cand.email}
                badges={
                  <span className={`badge ${statusBadge[cand.status] || 'badge-gray'}`}>{cand.status}</span>
                }
                actions={
                  <>
                    <button className="action-btn" onClick={() => openEdit(cand)}><Edit2 size={13} /> Edit</button>
                    <button className="action-btn" onClick={() => { if (window.confirm('Remove candidate?')) deleteMutation.mutate(cand.id) }}><Trash2 size={13} /> Delete</button>
                  </>
                }
              />
            )}
          />
        )}
      </div>

      {modal && (
        <Modal
          title={editId ? 'Edit candidate' : 'Add candidate'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save candidate'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group"><label className="form-label">First name *</label><input className="form-control" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Last name *</label><input className="form-control" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Mobile *</label><input className="form-control" value={form.mobile} onChange={e => set('mobile', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Position applying for</label><input className="form-control" value={form.position_applied} onChange={e => set('position_applied', e.target.value)} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">College</label>
            <textarea className="form-control" rows={3} value={form.college_name} onChange={e => set('college_name', e.target.value)} placeholder="Enter the candidate's college / university name…" />
          </div>
          <div className="form-group"><label className="form-label">Cover letter / notes</label><textarea className="form-control" rows={3} value={form.cover_letter} onChange={e => set('cover_letter', e.target.value)} placeholder="Paste cover letter or notes…" /></div>
        </Modal>
      )}
    </div>
  )
}
