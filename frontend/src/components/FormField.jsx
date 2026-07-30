export default function FormField({ label, required, error, children, className = '' }) {
  return (
    <div className={`form-group ${className} ${error ? 'form-group-error' : ''}`}>
      {label && <label className="form-label">{label} {required && <span className="form-required">*</span>}</label>}
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}
