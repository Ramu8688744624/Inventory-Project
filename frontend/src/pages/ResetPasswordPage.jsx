import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password })
      setToken(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="authPage">
        <div className="authCard">
          <h1 className="authTitle">Reset password</h1>
          <p className="authError">Invalid or missing reset link.</p>
          <Link to="/forgot-password" className="authLink">Request new link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Set new password</h1>
        <form onSubmit={handleSubmit} className="authForm">
          {error && <div className="authError">{error}</div>}
          <div className="formField">
            <label className="formLabel" htmlFor="rp-password">New password</label>
            <input
              id="rp-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="rp-confirm">Confirm password</label>
            <input
              id="rp-confirm"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btnPrimary authSubmit" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  )
}
