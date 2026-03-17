import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { useToast } from '../components/useToast'

export default function OutOfStockPage() {
  const setToast = useToast()
  const [rows, setRows] = useState([])

  const load = () =>
    api
      .get('/reports/out-of-stock')
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [setToast])

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Out of Stock</h1>
          <p className="pageSubtitle">Items where quantity = 0</p>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.id}>
                  <td>{it.item_name}</td>
                  <td className="muted">{it.model}</td>
                  <td className="muted">{it.category?.name}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="3" className="emptyCell">
                    No out of stock items
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
