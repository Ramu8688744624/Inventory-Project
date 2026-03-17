import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api
      .get('/auth/config')
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div className="authPage">
        <div className="authCard">Checking registration status…</div>
      </div>
    )
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Registration disabled</h1>
        <p className="muted">Public registration is disabled. Please ask an administrator to create your account.</p>
        <Link to="/login" className="authLink">Back to login</Link>
      </div>
    </div>
  )
}

