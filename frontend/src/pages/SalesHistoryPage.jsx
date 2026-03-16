import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

export default function SalesHistoryPage() {
  const setToast = useToast()
  const [filter, setFilter] = useState('today')
  const [from, setFrom] = useState(ymd(new Date()))
  const [to, setTo] = useState(ymd(new Date()))
  const [sales, setSales] = useState([])

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  const load = () =>
    api
      .get('/sales', { params: { filter, from: filter === 'custom' ? from : undefined, to: filter === 'custom' ? to : undefined } })
      .then((r) => setSales(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [filter])

  const rows = useMemo(() => {
    const out = []
    for (const s of sales) {
      const soldAt = new Date(s.sold_at)
      for (const li of s.sale_items || []) {
        out.push({
          id: li.id,
          soldAt,
          item: `${li.item_name_snapshot} ${li.model_snapshot}`,
          category: li.category_name_snapshot,
          qty: li.quantity,
          selling: li.selling_price_each,
          profit: li.line_profit,
        })
      }
    }
    out.sort((a, b) => b.soldAt - a.soldAt)
    return out
  }, [sales])

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Sales History</div>
          <div className="muted">Filter by date range</div>
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

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Selling</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted">{r.soldAt.toLocaleString()}</td>
                <td>{r.item}</td>
                <td className="muted">{r.category}</td>
                <td>{r.qty}</td>
                <td>{money(r.selling)}</td>
                <td className="muted">{money(r.profit)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="6" className="muted">No sales found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

