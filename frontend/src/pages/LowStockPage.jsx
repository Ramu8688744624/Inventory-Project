import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { useToast } from '../components/useToast'

export default function LowStockPage() {
  const setToast = useToast()
  const [rows, setRows] = useState([])

  const load = () =>
    api
      .get('/reports/low-stock')
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [setToast])

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
              {rows.map((it) => (
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
      </section>
    </div>
  )
}
