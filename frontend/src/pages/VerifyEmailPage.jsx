import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, getErrorMessage } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { setToken } = useAuth()
  const [status, setStatus] = useState('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('missing')
      return
    }
    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        setToken(res.data.token, res.data.user)
        setStatus('success')
      })
      .catch((err) => {
        setError(getErrorMessage(err))
        setStatus('error')
      })
  }, [token, setToken])

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Email verification</h1>
        {status === 'verifying' && <p className="muted">Verifying…</p>}
        {status === 'missing' && (
          <p className="authError">Invalid link. No token provided.</p>
        )}
        {status === 'error' && <p className="authError">{error}</p>}
        {status === 'success' && (
          <div className="authSuccess">
            <p>Email verified. Redirecting…</p>
            <Link to="/" className="btn btnPrimary">Go to dashboard</Link>
          </div>
        )}
        {status !== 'verifying' && <Link to="/login" className="authLink">Back to login</Link>}
      </div>
    </div>
  )
}
