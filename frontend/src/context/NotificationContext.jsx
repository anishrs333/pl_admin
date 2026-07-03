import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  const fetchCount = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/notifications/unread_count/')
      setCount(res.data.count)
    } catch {}
  }, [user])

  const fetchAll = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/notifications/')
      setNotifications(res.data?.results || res.data || [])
    } catch {}
  }, [user])

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/mark_read/`)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
    setCount(c => Math.max(0, c - 1))
  }

  const markAllRead = async () => {
    await api.post('/notifications/mark_all_read/')
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    setCount(0)
  }

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [fetchCount])

  useEffect(() => {
    if (open) fetchAll()
  }, [open, fetchAll])

  return (
    <NotifContext.Provider value={{ count, notifications, open, setOpen, markRead, markAllRead, fetchCount }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotif = () => useContext(NotifContext)
