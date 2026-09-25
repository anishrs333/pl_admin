import { useState, useEffect } from 'react'

export default function ResponsiveTable({ headers, data, renderRow, renderCard }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768)
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  if (isMobile) {
    return (
      <div className="responsive-card-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.length === 0 ? (
          <div className="empty-state">
            <p>No records found.</p>
          </div>
        ) : (
          data.map((item, index) => renderCard(item, index))
        )}
      </div>
    )
  }

  return (
    <div className="table-wrap" style={{ margin: 0 }}>
      <table>
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
  )
}
