import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import Toast from './Toast'
import PageTitle from './PageTitle'

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler(e)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

function useDebounced(value, delayMs) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

const MOBILE_BREAKPOINT = 900

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q, 150)
  const [results, setResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const activeReq = useRef(0)
  const searchRef = useRef(null)
  useClickOutside(searchRef, () => setSearchOpen(false))

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

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="appShell">
      <PageTitle />
      <button
        type="button"
        className="menuToggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        <span className="menuToggleBar" />
        <span className="menuToggleBar" />
        <span className="menuToggleBar" />
      </button>
      <div className={`sidebarOverlay ${menuOpen ? 'sidebarOverlayOpen' : ''}`} onClick={closeMenu} aria-hidden="true" />
      <aside className={`sidebar ${menuOpen ? 'sidebarOpen' : ''}`}>
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
              onClick={closeMenu}
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
          <div className="searchBox searchBoxWrap" ref={searchRef}>
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
              <div className="card searchDropdown" onMouseDown={(e) => e.preventDefault()}>
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
            <button
              className="btn btnDanger"
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              }}
            >
              Reset Application Data
            </button>
          </div>
        </div>

        <Outlet context={{ toast, setToast }} />
      </main>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}

