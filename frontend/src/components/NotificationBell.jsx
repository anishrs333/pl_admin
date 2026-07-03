import { useRef, useEffect } from 'react'
import { Bell, CheckCheck, Clock, FileText, CalendarDays, DollarSign, CheckCircle } from 'lucide-react'
import { useNotif } from '../context/NotificationContext'

const TYPE_ICONS = {
  task_assigned: <CheckCircle size={14} style={{ color: 'var(--indigo)' }} />,
  task_completed: <CheckCheck size={14} style={{ color: '#1F7A45' }} />,
  leave_applied: <CalendarDays size={14} style={{ color: 'var(--amber)' }} />,
  leave_approved: <CalendarDays size={14} style={{ color: '#1F7A45' }} />,
  leave_rejected: <CalendarDays size={14} style={{ color: 'var(--red)' }} />,
  salary_generated: <DollarSign size={14} style={{ color: 'var(--indigo)' }} />,
  salary_paid: <DollarSign size={14} style={{ color: '#1F7A45' }} />,
  general: <Bell size={14} style={{ color: 'var(--slate)' }} />,
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const { count, notifications, open, setOpen, markRead, markAllRead } = useNotif()
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, setOpen])

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}
        title="Notifications"
      >
        <Bell size={17} />
        {count > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#F87171', border: '1.5px solid var(--indigo-deep)' }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 44, left: 0, width: 340, background: '#fff', borderRadius: 12,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.20)', border: '1px solid var(--border)', zIndex: 1000,
          maxHeight: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications {count > 0 && <span style={{ background: 'var(--indigo)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>{count}</span>}</span>
            {count > 0 && (
              <button onClick={markAllRead} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--indigo)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--slate)', fontSize: 13 }}>
                <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>No notifications yet</div>
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: n.is_read ? 'default' : 'pointer',
                  background: n.is_read ? '#fff' : 'var(--indigo-50)', display: 'flex', gap: 10, alignItems: 'flex-start',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {TYPE_ICONS[n.notification_type] || TYPE_ICONS.general}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />{timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0, marginTop: 5 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
