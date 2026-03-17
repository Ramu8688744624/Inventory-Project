import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Forgot password</h1>
        <p className="muted authSubtitle">Enter your email to receive a reset link</p>
        {sent ? (
          <div className="authSuccess">
            <p>If the email exists, a reset link has been sent. Check your inbox and the server console (in dev).</p>
            <Link to="/login" className="btn btnPrimary">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="authForm">
            {error && <div className="authError">{error}</div>}
            <div className="formField">
              <label className="formLabel" htmlFor="fp-email">Email</label>
              <input
                id="fp-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn btnPrimary authSubmit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <Link to="/login" className="authLink">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  )
}
