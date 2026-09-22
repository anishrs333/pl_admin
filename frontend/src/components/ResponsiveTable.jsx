import { useState, useEffect } from 'react'
import { LayoutList, Table } from 'lucide-react'

export default function ResponsiveTable({ headers, data, renderRow, renderCard }) {
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'card'

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768)
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  return (
    <div>
      {isMobile && renderCard && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 600 }}>
            {viewMode === 'table' ? '👈 Swipe table horizontally to see all data 👉' : 'Card View'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => setViewMode('table')}
            >
              <Table size={13} /> Table
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => setViewMode('card')}
            >
              <LayoutList size={13} /> Cards
            </button>
          </div>
        </div>
      )}

      {isMobile && viewMode === 'card' && renderCard ? (
        <div className="responsive-card-list" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 12 }}>
          {data.length === 0 ? (
            <div className="empty-state">
              <p>No records found.</p>
            </div>
          ) : (
            data.map((item, index) => renderCard(item, index))
          )}
        </div>
      ) : (
        <div 
          className="table-wrap" 
          style={{ 
            margin: 0, 
            overflowX: 'auto', 
            WebkitOverflowScrolling: 'touch', 
            touchAction: 'pan-x pan-y',
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
            borderRadius: isMobile ? 0 : 16
          }}
        >
          <table style={{ minWidth: 'max-content', width: '100%', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                {headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: 40, color: 'var(--slate)' }}>No records found.</td></tr>
              ) : (
                data.map((item, index) => renderRow(item, index))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
