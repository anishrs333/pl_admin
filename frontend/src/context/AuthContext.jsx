import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import api, { setAccessToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Attempt to restore session using refresh token cookie on mount
    axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh/`, {}, { withCredentials: true })
      .then(res => {
        const token = res.data.access
        setAccessToken(token)
        return api.get('/auth/me/')
      })
      .then(r => setUser(r.data))
      .catch(() => {
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password })
    const token = res.data.access
    setAccessToken(token)
    const meRes = await api.get('/auth/me/')
    setUser(meRes.data)
    return { ...res.data, ...meRes.data }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout/')
    } catch (e) {
      console.error('Logout failed', e)
    }
    setAccessToken(null)
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
