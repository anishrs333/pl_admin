import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me/')
      .then(r => setUser(r.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    const meRes = await api.get('/auth/me/')
    setUser(meRes.data)
    return { ...res.data, ...meRes.data }
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const refreshMe = async () => {
    const meRes = await api.get('/auth/me/')
    setUser(meRes.data)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
