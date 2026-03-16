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
  }, [])

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Low Stock</div>
          <div className="muted">Items where quantity is low (default ≤ 2)</div>
        </div>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      <div className="card">
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
                <td><span className="pill">{it.quantity}</span></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="4" className="muted">No low stock items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

