import { useEffect, useState, useMemo } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

export default function StockPage() {
  const setToast = useToast()
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const defaultColumns = ['item', 'model', 'category', 'qty', 'selling', 'total_stock_value']
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('stock_columns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      } catch {
        // ignore
      }
    }
    return defaultColumns
  })

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

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
    localStorage.setItem('stock_columns', JSON.stringify(nextCols))
  }

  const toggleColumn = (col) => {
    const next = visibleColumns.includes(col)
      ? visibleColumns.filter((c) => c !== col)
      : [...visibleColumns, col]
    saveColumnPreferences(next)
  }

  const load = () =>
    api
      .get('/reports/stock', { params: { categoryId: categoryId || undefined, page, pageSize } })
      .then((r) => {
        setRows(r.data?.data || [])
        setTotalCount(r.data?.meta?.count || 0)
      })
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [categoryId, page, pageSize])

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
        <div className="paginationRow">
          <div>
            <label>
              Rows per page:
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <span>{totalCount} total</span>
            <button className="btn btnSm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <button className="btn btnSm" disabled={page >= Math.ceil(totalCount / pageSize)} onClick={() => setPage((p) => p + 1)}>Next</button>
            <span>Page {page}</span>
          </div>
        </div>
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
