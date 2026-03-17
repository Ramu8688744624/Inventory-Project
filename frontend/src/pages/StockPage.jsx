import { useEffect, useState, useMemo } from 'react'
import { api, getErrorMessage, AUTH_ENABLED } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/useToast'

export default function StockPage() {
  const setToast = useToast()
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [rows, setRows] = useState([])

  const defaultColumns = ['item', 'model', 'category', 'qty', 'selling', 'total_stock_value']
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (AUTH_ENABLED && user?.settings?.stockColumns?.length) {
      return user.settings.stockColumns
    }
    if (!AUTH_ENABLED) {
      const saved = localStorage.getItem('stock_columns')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        } catch (e) {
          // ignore
        }
      }
    }
    return defaultColumns
  })

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`


  useEffect(() => {
    if (AUTH_ENABLED && user?.settings?.stockColumns) {
      setVisibleColumns(user.settings.stockColumns)
    }
  }, [AUTH_ENABLED, user])

  const categoryOptions = useMemo(() => {
    const list = (categories || []).filter((c) => c.name && c.name.trim())
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  useEffect(() => {
    api
      .get('/categories')
      .then((r) => setCategories(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))
  }, [setToast])

  const saveColumnPreferences = async (nextCols) => {
    setVisibleColumns(nextCols)
    if (AUTH_ENABLED && user?.id) {
      try {
        await api.patch('/auth/settings', { stockColumns: nextCols })
      } catch (e) {
        setToast(getErrorMessage(e))
      }
    } else {
      localStorage.setItem('stock_columns', JSON.stringify(nextCols))
    }
  }

  const toggleColumn = (col) => {
    const next = visibleColumns.includes(col)
      ? visibleColumns.filter((c) => c !== col)
      : [...visibleColumns, col]
    saveColumnPreferences(next)
  }

  const load = () =>
    api
      .get('/reports/stock', { params: { categoryId: categoryId || undefined } })
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [categoryId])

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Stock Management</h1>
          <p className="pageSubtitle">Full inventory list with stock value</p>
        </div>
        <div className="filterRow">
          <select
            className="select selectSm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button className="btn" onClick={load}>
            Refresh
          </button>
        </div>
      </header>

      <section className="card cardSection">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                {visibleColumns.includes('item') && <th>Item</th>}
                {visibleColumns.includes('model') && <th>Model</th>}
                {visibleColumns.includes('category') && <th>Category</th>}
                {visibleColumns.includes('qty') && <th>Qty</th>}
                {visibleColumns.includes('cost') && <th>Cost</th>}
                {visibleColumns.includes('selling') && <th>Selling</th>}
                {visibleColumns.includes('total_stock_value') && <th>Total Stock Value</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {visibleColumns.includes('item') && <td>{r.item_name}</td>}
                  {visibleColumns.includes('model') && <td className="muted">{r.model}</td>}
                  {visibleColumns.includes('category') && <td className="muted">{r.category?.name}</td>}
                  {visibleColumns.includes('qty') && (
                    <td>
                      {r.quantity === 0 ? (
                        <span className="pill pillDanger">0</span>
                      ) : (
                        <span className="pill">{r.quantity}</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.includes('cost') && <td className="muted">{money(r.cost_price)}</td>}
                  {visibleColumns.includes('selling') && <td>{money(r.selling_price)}</td>}
                  {visibleColumns.includes('total_stock_value') && <td>{money(r.total_stock_value)}</td>}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)} className="emptyCell">
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
