import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { shopConfig } from '../services/shopConfig'
import { api, getErrorMessage, AUTH_ENABLED } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/useToast'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const setToast = useToast()
  const [importing, setImporting] = useState(false)
  const [stockColumns, setStockColumns] = useState(['item', 'model', 'category', 'qty', 'selling', 'total_stock_value'])
  const [savingColumns, setSavingColumns] = useState(false)
  const [showFinancialData, setShowFinancialData] = useState(false)
  const [savingFinancial, setSavingFinancial] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('user')
  const [creatingUser, setCreatingUser] = useState(false)

  const loadAdminUsers = async () => {
    if (!user || user.role !== 'admin') return
    try {
      const res = await api.get('/admin/users')
      setAdminUsers(res.data?.data || [])
    } catch (err) {
      setToast(getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (AUTH_ENABLED && user?.settings?.stockColumns && user.settings.stockColumns.length) {
      setStockColumns(user.settings.stockColumns)
    } else {
      const saved = localStorage.getItem('stock_columns')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length) setStockColumns(parsed)
        } catch {
          // ignore
        }
      }
    }

    if (AUTH_ENABLED && user?.settings?.showFinancialData !== undefined) {
      setShowFinancialData(Boolean(user.settings.showFinancialData))
    } else {
      const savedFinancial = localStorage.getItem('showFinancialData')
      setShowFinancialData(savedFinancial === 'true')
    }

    if (user?.role === 'admin') {
      loadAdminUsers()
    }
  }, [user])

  const exportBackup = async () => {
    try {
      const res = await api.get('/backup/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory-backup.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setToast('Backup exported')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const saveStockColumns = async () => {
    setSavingColumns(true)
    try {
      if (AUTH_ENABLED && user?.id) {
        await api.patch('/auth/settings', { stockColumns })
      } else {
        localStorage.setItem('stock_columns', JSON.stringify(stockColumns))
      }
      setToast('Stock column settings saved')
    } catch (e) {
      setToast(getErrorMessage(e))
    } finally {
      setSavingColumns(false)
    }
  }

  const saveShowFinancialData = async (value) => {
    setSavingFinancial(true)
    try {
      if (AUTH_ENABLED && user?.id) {
        await api.patch('/auth/settings', { showFinancialData: value })
      } else {
        localStorage.setItem('showFinancialData', value ? 'true' : 'false')
      }
      setShowFinancialData(value)
      setToast('Financial data visibility setting saved')
    } catch (e) {
      setToast(getErrorMessage(e))
    } finally {
      setSavingFinancial(false)
    }
  }

  const createUser = async (e) => {
    e.preventDefault()
    setCreatingUser(true)
    try {
      const body = { email: newUserEmail, password: newUserPassword, role: newUserRole }
      await api.post('/admin/users', body)
      setToast('User created successfully')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('user')
      await loadAdminUsers()
    } catch (e) {
      setToast(getErrorMessage(e))
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Settings</h1>
          <p className="pageSubtitle">Branding and configuration</p>
        </div>
      </header>

      <section className="card cardSection">
        <div className="cardTitle">Branding</div>
        <p className="muted" style={{ marginBottom: 16 }}>
          Configure shop name, city, and currency in backend settings or environment configuration.
        </p>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Setting</th>
                <th>Current value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="muted">Shop name</td>
                <td>{shopConfig.name}</td>
              </tr>
              <tr>
                <td className="muted">City</td>
                <td>{shopConfig.city}</td>
              </tr>
              <tr>
                <td className="muted">Currency</td>
                <td>{shopConfig.currencySymbol}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Financial Visibility</div>
        <p className="muted" style={{ marginBottom: 16 }}>
          Control whether sensitive financial values are shown in dashboard and reports.
        </p>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={showFinancialData}
            onChange={(e) => saveShowFinancialData(e.target.checked)}
          />{' '}
          Show financial values
        </label>
        <p className="muted" style={{ marginBottom: 16 }}>
          When disabled, dashboard values are masked as {shopConfig.currencySymbol} ****.
        </p>
        <div className="actionGroup" style={{ marginBottom: 16 }}>
          <button
            className="btn btnSecondary"
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Logout
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Stock Column Visibility</div>
        <p className="muted" style={{ marginBottom: 16 }}>
          Select which columns are visible in the stock table. This can be saved per-user when auth is enabled.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {[
            { id: 'item', label: 'Item' },
            { id: 'model', label: 'Model' },
            { id: 'category', label: 'Category' },
            { id: 'qty', label: 'Qty' },
            { id: 'cost', label: 'Cost' },
            { id: 'selling', label: 'Selling' },
            { id: 'total_stock_value', label: 'Total Stock Value' },
          ].map((col) => (
            <label key={col.id} style={{ display: 'block', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={stockColumns.includes(col.id)}
                onChange={() => {
                  const next = stockColumns.includes(col.id)
                    ? stockColumns.filter((c) => c !== col.id)
                    : [...stockColumns, col.id]
                  setStockColumns(next)
                }}
              />{' '}
              {col.label}
            </label>
          ))}
        </div>
        <div className="actionGroup" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={saveStockColumns} disabled={savingColumns}>
            {savingColumns ? 'Saving…' : 'Save stock column settings'}
          </button>
        </div>
      </section>

      {user?.role === 'admin' && (
        <section className="card cardSection">
          <div className="cardTitle">Admin user management</div>
          <p className="muted" style={{ marginBottom: 16 }}>
            Create and audit users. This is an admin-only action.
          </p>

          <form onSubmit={createUser} className="authForm" style={{ marginBottom: 16 }}>
            <div className="formField">
              <label className="formLabel" htmlFor="new-user-email">Email</label>
              <input
                id="new-user-email"
                type="email"
                className="input"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
            </div>
            <div className="formField">
              <label className="formLabel" htmlFor="new-user-password">Password</label>
              <input
                id="new-user-password"
                type="password"
                className="input"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="formField">
              <label className="formLabel" htmlFor="new-user-role">Role</label>
              <select
                id="new-user-role"
                className="input"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="actionGroup">
              <button type="submit" className="btn btnPrimary" disabled={creatingUser}>
                {creatingUser ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                  </tr>
                ))}
                {adminUsers.length === 0 && (
                  <tr>
                    <td colSpan="3" className="muted">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card cardSection">
        <div className="cardTitle">Backup & Restore</div>
        <p className="muted" style={{ marginBottom: 16 }}>
          Export or import all inventory, sales, and service income data. Safe for multi-shop (data is scoped by shop).
        </p>
        <div className="actionGroup">
          <button className="btn btnPrimary" onClick={exportBackup}>
            Export backup (.json)
          </button>
          <button className="btn" onClick={async () => {
            try {
              const res = await api.get('/backup/export-history', { responseType: 'blob' })
              const url = window.URL.createObjectURL(new Blob([res.data]))
              const a = document.createElement('a')
              a.href = url
              a.download = 'inventory-history-backup.json'
              document.body.appendChild(a)
              a.click()
              a.remove()
              window.URL.revokeObjectURL(url)
              setToast('History backup exported')
            } catch (e) {
              setToast(getErrorMessage(e))
            }
          }}>
            Export history backup (.json)
          </button>
          <label className="btn">
            Import backup
            <input
              type="file"
              accept=".json"
              className="srOnly"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) importBackup(f)
              }}
            />
          </label>
          <label className="btn">
            Restore history
            <input
              type="file"
              accept=".json"
              className="srOnly"
              disabled={importing}
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                setImporting(true)
                try {
                  const text = await f.text()
                  const data = JSON.parse(text)
                  await api.post('/backup/restore-history', data)
                  setToast('History restored. Refresh the page to see changes.')
                  window.location.reload()
                } catch (err) {
                  setToast(getErrorMessage(err))
                } finally {
                  setImporting(false)
                }
              }}
            />
          </label>
        </div>
        <p className="cardNote">
          Import replaces all current shop data with the backup. Export first before importing.
        </p>
      </section>
    </div>
  )
}
