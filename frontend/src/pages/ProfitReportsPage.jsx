import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

export default function ProfitReportsPage() {
  const setToast = useToast()
  const [filter, setFilter] = useState('today')
  const [from, setFrom] = useState(ymd(new Date()))
  const [to, setTo] = useState(ymd(new Date()))

  const [summary, setSummary] = useState(null)
  const [byCategory, setByCategory] = useState([])
  const [byItem, setByItem] = useState([])

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  const load = async () => {
    try {
      const params = { filter, from: filter === 'custom' ? from : undefined, to: filter === 'custom' ? to : undefined }
      const [s, c, i] = await Promise.all([
        api.get('/reports/profit/summary', { params }),
        api.get('/reports/profit/by-category', { params }),
        api.get('/reports/profit/by-item', { params: { ...params, limit: 100 } }),
      ])
      setSummary(s.data?.data)
      setByCategory(c.data?.data || [])
      setByItem(i.data?.data || [])
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Profit Reports</div>
          <div className="muted">Sales profit + service profit</div>
        </div>
        <div className="row">
          <select className="select" style={{ maxWidth: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom</option>
          </select>
          {filter === 'custom' && (
            <>
              <input className="input" style={{ maxWidth: 160 }} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input className="input" style={{ maxWidth: 160 }} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
          <button className="btn" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="grid3">
        <div className="card">
          <div className="cardTitle">Sales Profit</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{money(summary?.sales_profit)}</div>
          <div className="muted">From product sales</div>
        </div>
        <div className="card">
          <div className="cardTitle">Service Profit</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{money(summary?.service_profit)}</div>
          <div className="muted">Service income (100% profit)</div>
        </div>
        <div className="card">
          <div className="cardTitle">Total Profit</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{money(summary?.total_profit)}</div>
          <div className="muted">Combined</div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">Category-wise Profit</div>
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Qty</th>
                <th>Sales</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map((r) => (
                <tr key={r.category_id}>
                  <td>{r.category_name}</td>
                  <td className="muted">{r.quantity}</td>
                  <td>{money(r.sales)}</td>
                  <td className="muted">{money(r.profit)}</td>
                </tr>
              ))}
              {byCategory.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="cardTitle">Item-wise Profit (Top)</div>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Sales</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {byItem.map((r) => (
                <tr key={r.item_id}>
                  <td>
                    {r.item_name} <span className="muted">{r.model}</span>
                  </td>
                  <td className="muted">{r.quantity}</td>
                  <td>{money(r.sales)}</td>
                  <td className="muted">{money(r.profit)}</td>
                </tr>
              ))}
              {byItem.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

