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
      const params = {
        filter,
        from: filter === 'custom' ? from : undefined,
        to: filter === 'custom' ? to : undefined,
      }
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
  }, [filter, setToast])

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Profit Reports</h1>
          <p className="pageSubtitle">Sales profit + service profit</p>
        </div>
        <div className="filterRow">
          <select
            className="select selectSm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Date filter"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom range</option>
          </select>
          {filter === 'custom' && (
            <>
              <input
                className="input inputSm"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="From date"
              />
              <input
                className="input inputSm"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="To date"
              />
            </>
          )}
          <button className="btn" onClick={load}>
            Apply
          </button>
        </div>
      </header>

      <section className="grid3" aria-label="Profit summary">
        <div className="card cardSection">
          <div className="cardTitle">Sales Profit</div>
          <div className="statValue">{money(summary?.sales_profit)}</div>
          <p className="muted" style={{ margin: 0, fontSize: '0.9375rem' }}>
            From product sales
          </p>
        </div>
        <div className="card cardSection">
          <div className="cardTitle">Service Profit</div>
          <div className="statValue">{money(summary?.service_profit)}</div>
          <p className="muted" style={{ margin: 0, fontSize: '0.9375rem' }}>
            Service income (100% profit)
          </p>
        </div>
        <div className="card cardSection">
          <div className="cardTitle">Total Profit</div>
          <div className="statValue">{money(summary?.total_profit)}</div>
          <p className="muted" style={{ margin: 0, fontSize: '0.9375rem' }}>
            Combined
          </p>
        </div>
      </section>

      <div className="sectionGap" />

      <section className="grid2" aria-label="Category and item profit">
        <div className="card cardSection">
          <div className="cardTitle">Category-wise Profit</div>
          <div className="tableWrap">
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
                    <td colSpan="4" className="emptyCell">
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card cardSection">
          <div className="cardTitle">Item-wise Profit (Top)</div>
          <div className="tableWrap">
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
                    <td colSpan="4" className="emptyCell">
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
