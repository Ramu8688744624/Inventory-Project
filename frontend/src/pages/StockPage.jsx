import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

export default function StockPage() {
  const setToast = useToast()
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [rows, setRows] = useState([])

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  useEffect(() => {
    api
      .get('/categories')
      .then((r) => setCategories(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))
  }, [])

  const load = () =>
    api
      .get('/reports/stock', { params: { categoryId: categoryId || undefined } })
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [categoryId])

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Stock Management</div>
          <div className="muted">Full inventory list with stock value</div>
        </div>
        <div className="row">
          <select className="select" style={{ maxWidth: 260 }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Model</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Cost</th>
              <th>Selling</th>
              <th>Total Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.item_name}</td>
                <td className="muted">{r.model}</td>
                <td className="muted">{r.category?.name}</td>
                <td>
                  {r.quantity === 0 ? <span className="pill pillDanger">0</span> : <span className="pill">{r.quantity}</span>}
                </td>
                <td className="muted">{money(r.cost_price)}</td>
                <td>{money(r.selling_price)}</td>
                <td>{money(r.total_stock_value)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

