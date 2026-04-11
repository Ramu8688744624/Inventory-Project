import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'
import PaginationControls from '../components/PaginationControls'
import ConfirmDialog from '../components/ConfirmDialog'

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
  const [confirmDelete, setConfirmDelete] = useState({ open: false, sale: null })

  const defaultSalesColumns = ['date', 'item', 'category', 'qty', 'selling', 'profit']
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('sales_history_columns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length) return parsed
      } catch {
        // ignore
      }
    }
    return defaultSalesColumns
  })

  // Load visible columns from localStorage when they change in Settings
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sales_history_columns')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length) {
            setVisibleColumns(parsed)
          }
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

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

  const deleteSale = async () => {
    if (!confirmDelete.sale) return
    try {
      await api.delete(`/sales/${confirmDelete.sale.id}`)
      setToast('Sale deleted and backed up successfully')
      setConfirmDelete({ open: false, sale: null })
      load()
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

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
                {visibleColumns.includes('date') && <th>Date</th>}
                {visibleColumns.includes('item') && <th>Item</th>}
                {visibleColumns.includes('category') && <th>Category</th>}
                {visibleColumns.includes('qty') && <th>Qty</th>}
                {visibleColumns.includes('selling') && <th>Selling</th>}
                {visibleColumns.includes('profit') && <th>Profit</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows && visibleRows.map((row) => (
                <tr key={row.id}>
                  {visibleColumns.includes('date') && <td className="muted">{row.soldAt.toLocaleString()}</td>}
                  {visibleColumns.includes('item') && <td>{row.item}</td>}
                  {visibleColumns.includes('category') && <td>{row.category}</td>}
                  {visibleColumns.includes('qty') && <td>{row.qty}</td>}
                  {visibleColumns.includes('selling') && <td>{money(row.selling)}</td>}
                  {visibleColumns.includes('profit') && <td className="muted">{money(row.profit)}</td>}
                  <td>
                    <button
                      className="btnIcon btnIconDanger"
                      onClick={() => {
                        const saleObj = sales.find(s => s.sale_items?.some(si => si.id === row.id))
                        setConfirmDelete({ open: true, sale: saleObj })
                      }}
                      title="Delete sale"
                      aria-label="Delete sale"
                    >
                      <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {!visibleRows || visibleRows.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="emptyCell">
                    No sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          total={rows?.length || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      </section>

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Sale?"
        message={`Delete Sale #${confirmDelete.sale?.id} (${money(confirmDelete.sale?.total_amount)})? Stock will be restored and this action is backed up in history.`}
        onConfirm={deleteSale}
        onCancel={() => setConfirmDelete({ open: false, sale: null })}
        isDanger
      />
    </div>
  )
}
