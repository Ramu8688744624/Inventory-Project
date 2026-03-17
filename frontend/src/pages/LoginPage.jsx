import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api, getErrorMessage, AUTH_ENABLED } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { shopConfig } from '../services/shopConfig'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(true)

  useEffect(() => {
    if (!AUTH_ENABLED) return
    api
      .get('/auth/config')
      .then((res) => setAllowRegistration(Boolean(res.data?.allowRegistration)))
      .catch(() => setAllowRegistration(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">{shopConfig.name}</h1>
        <p className="muted authSubtitle">Sign in to continue</p>
        {new URLSearchParams(location?.search || '').get('registered') && (
          <p className="muted" style={{ marginBottom: 0, fontSize: '0.9375rem' }}>
            Check console/email for verification link.
          </p>
        )}
        <form onSubmit={handleSubmit} className="authForm">
          {error && <div className="authError">{error}</div>}
          <div className="formField">
            <label className="formLabel" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btnPrimary authSubmit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <Link to="/forgot-password" className="authLink">Forgot password?</Link>
        </form>
      </div>
    </div>
  )
}
