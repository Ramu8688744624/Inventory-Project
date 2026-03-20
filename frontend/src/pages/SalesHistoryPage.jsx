import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'
import PaginationControls from '../components/PaginationControls'

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

export default function SalesHistoryPage() {
  const setToast = useToast()
  const [filter, setFilter] = useState('today')
  const [from, setFrom] = useState(ymd(new Date()))
  const [to, setTo] = useState(ymd(new Date()))
  const [sales, setSales] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  const load = () =>
    api
      .get('/sales', {
        params: {
          filter,
          from: filter === 'custom' ? from : undefined,
          to: filter === 'custom' ? to : undefined,
        },
      })
      .then((r) => setSales(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [filter, setToast])

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

  useEffect(() => {
    setPage(1)
  }, [rows, pageSize])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Sales History</h1>
          <p className="pageSubtitle">Filter by date range</p>
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

      <section className="card cardSection">
        <div className="tableWrap">
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
              {visibleRows.map((r) => (
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
                  <td colSpan="6" className="emptyCell">
                    No sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          total={rows.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      </section>
    </div>
  )
}
