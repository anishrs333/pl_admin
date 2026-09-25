export default function MobileCard({ avatar, title, subtitle, badges, actions }) {
  return (
    <div className="card mobile-table-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {avatar && <div style={{ flexShrink: 0 }}>{avatar}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2 }}>{subtitle}</div>}
          {badges && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {badges}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
