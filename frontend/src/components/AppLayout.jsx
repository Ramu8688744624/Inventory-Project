import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import Toast from './Toast'

function useDebounced(value, delayMs) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export default function AppLayout() {
  const navigate = useNavigate()
  const [toast, setToast] = useState('')

  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q, 150)
  const [results, setResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const activeReq = useRef(0)

  useEffect(() => {
    const term = String(debouncedQ || '').trim()
    if (!term) {
      setResults([])
      return
    }
    const reqId = ++activeReq.current
    api
      .get('/items', { params: { q: term } })
      .then((res) => {
        if (reqId !== activeReq.current) return
        setResults(res.data?.data || [])
      })
      .catch((err) => {
        if (reqId !== activeReq.current) return
        setToast(getErrorMessage(err))
      })
  }, [debouncedQ])

  const nav = useMemo(
    () => [
      { to: '/', label: 'Dashboard' },
      { to: '/sales-pos', label: 'Sales POS' },
      { to: '/inventory', label: 'Inventory' },
      { to: '/categories', label: 'Categories' },
      { to: '/stock', label: 'Stock' },
      { to: '/out-of-stock', label: 'Out of Stock' },
      { to: '/low-stock', label: 'Low Stock' },
      { to: '/sales-history', label: 'Sales History' },
      { to: '/profit-reports', label: 'Profit Reports' },
      { to: '/service-income', label: 'Service Income' },
      { to: '/settings', label: 'Settings' },
    ],
    []
  )

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <div className="brandTitle">{shopConfig.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {shopConfig.city}
            </div>
          </div>
        </div>
        <div className="navGroup">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `navItem ${isActive ? 'navItemActive' : ''}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="searchBox" style={{ position: 'relative' }}>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search item name or model…"
            />

            {searchOpen && q.trim() && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: 48,
                  left: 0,
                  right: 0,
                  padding: 0,
                  maxHeight: 320,
                  overflow: 'auto',
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Model</th>
                      <th>Qty</th>
                      <th>Selling</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(results || []).slice(0, 10).map((it) => (
                      <tr
                        key={it.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSearchOpen(false)
                          setQ('')
                          navigate('/sales-pos', { state: { preselectItemId: it.id } })
                        }}
                      >
                        <td>{it.item_name}</td>
                        <td className="muted">{it.model}</td>
                        <td>{it.quantity}</td>
                        <td>{shopConfig.currencySymbol}{Number(it.selling_price).toFixed(2)}</td>
                      </tr>
                    ))}
                    {(results || []).length === 0 && (
                      <tr>
                        <td colSpan="4" className="muted">
                          No results
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="row">
            <button className="btn btnPrimary" onClick={() => navigate('/sales-pos')}>
              New Sale
            </button>
          </div>
        </div>

        <Outlet context={{ toast, setToast }} />
      </main>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}

