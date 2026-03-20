import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { useToast } from '../components/useToast'
import PaginationControls from '../components/PaginationControls'

export default function LowStockPage() {
  const setToast = useToast()
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = () =>
    api
      .get('/reports/low-stock')
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [setToast])

  useEffect(() => {
    setPage(1)
  }, [rows, pageSize])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Low Stock</h1>
          <p className="pageSubtitle">Items where quantity is low (default ≤ 2)</p>
        </div>
        <button className="btn" onClick={load}>
          Refresh
        </button>
      </header>

      <section className="card cardSection">
        <div className="tableWrap">
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
              {visibleRows.map((it) => (
                <tr key={it.id}>
                  <td>{it.item_name}</td>
                  <td className="muted">{it.model}</td>
                  <td className="muted">{it.category?.name}</td>
                  <td>
                    <span className="pill">{it.quantity}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="4" className="emptyCell">
                    No low stock items
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
