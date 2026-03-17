import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const AUTH_KEY = 'inventory_auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(AUTH_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setToken = useCallback((t, u) => {
    if (t) {
      localStorage.setItem(AUTH_KEY, t)
      setTokenState(t)
      setUser(u || null)
    } else {
      localStorage.removeItem(AUTH_KEY)
      setTokenState(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const authenticate = async () => {
      const storedToken = localStorage.getItem(AUTH_KEY)
      if (!storedToken) {
        setTokenState(null)
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const res = await api.get('/auth/me')
        setUser(res.data?.user || null)
        setTokenState(storedToken)
      } catch {
        localStorage.clear()
        sessionStorage.clear()
        setTokenState(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    authenticate()
  }, [])

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password })
      setToken(res.data.token, res.data.user)
      return res.data
    },
    [setToken]
  )

  const logout = useCallback(() => {
    localStorage.clear()
    sessionStorage.clear()
    setTokenState(null)
    setUser(null)
    window.location.replace('/login')
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  return ctx || { token: null, user: null, setToken: () => {}, logout: () => {} }
}
