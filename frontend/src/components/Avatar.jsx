export default function Avatar({ name = '', src, size = 36, className = '' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  if (src) {
    return <img src={src} alt={name} className={`avatar ${className}`} style={{ width: size, height: size }} />
  }
  return (
    <div className={`avatar avatar-fallback ${className}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials || '?'}
    </div>
  )
}
