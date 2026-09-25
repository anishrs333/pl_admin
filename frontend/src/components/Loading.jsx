export default function Loading({ text = 'Loading…', fullPage = false, size = 'md' }) {
  if (fullPage) {
    return (
      <div className="state-loading-full">
        <div className={`state-spinner state-spinner-${size}`} />
        <p className="state-loading-text">{text}</p>
      </div>
    )
  }
  return (
    <div className="state-loading">
      <div className={`state-spinner state-spinner-${size}`} />
      {text && <p className="state-loading-text">{text}</p>}
    </div>
  )
}
