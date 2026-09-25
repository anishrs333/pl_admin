export default function IDBadge({ code, label = 'ID', size }) {
  return (
    <div className={`id-badge ${size==='sm' ? 'sm' : ''}`}>
      <span className="id-badge-label">{label}</span>
      <span className="id-badge-code">{code}</span>
    </div>
  )
}
