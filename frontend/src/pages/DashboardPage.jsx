import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

export default function DashboardPage() {
  const setToast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get('/reports/dashboard')
      .then((res) => setData(res.data?.data))
      .catch((e) => setToast(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [setToast])

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Dashboard</div>
          <div className="muted">Fast overview for today & month</div>
        </div>
        <button className="btn" onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>

      {loading && <div className="card">Loading…</div>}
      {!loading && data && (
        <>
          <div className="grid3">
            <div className="card">
              <div className="cardTitle">Sales Today</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{money(data.sales_today)}</div>
              <div className="muted">This week: {money(data.sales_week)}</div>
            </div>
            <div className="card">
              <div className="cardTitle">Sales This Month</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{money(data.sales_month)}</div>
              <div className="muted">Month to date</div>
            </div>
            <div className="card">
              <div className="cardTitle">Profit Today</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{money(data.profit_today)}</div>
              <div className="muted">Month profit: {money(data.profit_month)}</div>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="grid2">
            <div className="card">
              <div className="cardTitle">Total Stock Value (Cost)</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{money(data.stock_value)}</div>
              <div className="muted">Inventory value at cost price</div>
            </div>
            <div className="card">
              <div className="cardTitle">Stock Alerts</div>
              <div className="muted">Low stock threshold: {data.low_stock_threshold}</div>
              <div className="row" style={{ marginTop: 8 }}>
                <span className="pill">Low stock: {data.low_stock_items?.length || 0}</span>
                <span className="pill pillDanger">Out of stock: {data.out_of_stock_items?.length || 0}</span>
              </div>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="grid2">
            <div className="card">
              <div className="cardTitle">Low Stock Items</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Model</th>
                    <th>Category</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.low_stock_items || []).map((it) => (
                    <tr key={it.id}>
                      <td>{it.item_name}</td>
                      <td className="muted">{it.model}</td>
                      <td className="muted">{it.category?.name}</td>
                      <td>
                        <span className="pill">{it.quantity}</span>
                      </td>
                    </tr>
                  ))}
                  {(data.low_stock_items || []).length === 0 && (
                    <tr>
                      <td colSpan="4" className="muted">
                        No low stock items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="cardTitle">Out of Stock Items</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Model</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.out_of_stock_items || []).map((it) => (
                    <tr key={it.id}>
                      <td>{it.item_name}</td>
                      <td className="muted">{it.model}</td>
                      <td className="muted">{it.category?.name}</td>
                    </tr>
                  ))}
                  {(data.out_of_stock_items || []).length === 0 && (
                    <tr>
                      <td colSpan="3" className="muted">
                        No out of stock items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

