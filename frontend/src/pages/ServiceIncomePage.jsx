import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

export default function ServiceIncomePage() {
  const setToast = useToast()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ service_name: '', amount: '', service_date: ymd(new Date()), notes: '' })
  const [saving, setSaving] = useState(false)

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  const load = () =>
    api
      .get('/services', { params: { filter: 'month' } })
      .then((r) => setRows(r.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    setSaving(true)
    try {
      await api.post('/services', {
        service_name: form.service_name,
        amount: Number(form.amount),
        service_date: form.service_date,
        notes: form.notes || null,
      })
      setForm({ service_name: '', amount: '', service_date: ymd(new Date()), notes: '' })
      await load()
      setToast('Service income saved')
    } catch (e) {
      setToast(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (r) => {
    if (!window.confirm('Delete this service entry?')) return
    try {
      await api.delete(`/services/${r.id}`)
      await load()
      setToast('Deleted')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Service Income</div>
          <div className="muted">Profit = Amount (no investment)</div>
        </div>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      <div className="card">
        <div className="grid3">
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Service Name</div>
            <input className="input" value={form.service_name} onChange={(e) => setForm((p) => ({ ...p, service_name: e.target.value }))} placeholder="e.g. Screen replacement" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Amount</div>
            <input className="input" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="e.g. 500" inputMode="decimal" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Date</div>
            <input className="input" type="date" value={form.service_date} onChange={(e) => setForm((p) => ({ ...p, service_date: e.target.value }))} />
          </div>
        </div>
        <div style={{ height: 10 }} />
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>Notes</div>
          <textarea className="textarea" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
        </div>
        <div style={{ height: 10 }} />
        <button className="btn btnPrimary" onClick={add} disabled={saving}>Save</button>
      </div>

      <div style={{ height: 12 }} />

      <div className="card">
        <div className="cardTitle">This Month</div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted">{r.service_date}</td>
                <td>{r.service_name}</td>
                <td>{money(r.amount)}</td>
                <td className="muted">{r.notes || ''}</td>
                <td>
                  <button className="btn btnDanger" onClick={() => remove(r)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="5" className="muted">No service income yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

