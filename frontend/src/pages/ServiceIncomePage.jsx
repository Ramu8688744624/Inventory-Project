import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'
import ConfirmDialog from '../components/ConfirmDialog'

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

export default function ServiceIncomePage() {
  const setToast = useToast()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ service_name: '', amount: '', service_date: ymd(new Date()), notes: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null })

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

  const remove = (r) => {
    setConfirmDelete({ open: true, row: r })
  }

  const handleRemoveConfirm = async () => {
    if (!confirmDelete.row) return
    try {
      await api.delete(`/services/${confirmDelete.row.id}`)
      await load()
      setToast('Deleted')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Service Income</h1>
          <p className="pageSubtitle">Profit = Amount (no investment)</p>
        </div>
        <button className="btn" onClick={load}>
          Refresh
        </button>
      </header>

      <section className="card cardSection">
        <h2 className="cardTitle">Add service income</h2>
        <div className="formGrid formGrid3">
          <div className="formField">
            <label className="formLabel" htmlFor="svc-name">
              Service name
            </label>
            <input
              id="svc-name"
              className="input"
              value={form.service_name}
              onChange={(e) => setForm((p) => ({ ...p, service_name: e.target.value }))}
              placeholder="e.g. Screen replacement"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="svc-amount">
              Amount
            </label>
            <input
              id="svc-amount"
              className="input"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="e.g. 500"
              inputMode="decimal"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="svc-date">
              Date
            </label>
            <input
              id="svc-date"
              className="input"
              type="date"
              value={form.service_date}
              onChange={(e) => setForm((p) => ({ ...p, service_date: e.target.value }))}
            />
          </div>
        </div>
        <div className="formField">
          <label className="formLabel" htmlFor="svc-notes">
            Notes (optional)
          </label>
          <textarea
            id="svc-notes"
            className="textarea"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Optional notes"
          />
        </div>
        <button className="btn btnPrimary" onClick={add} disabled={saving}>
          Save
        </button>
      </section>

      <section className="card cardSection">
        <h2 className="cardTitle">This month</h2>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Notes</th>
                <th className="colActions"></th>
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
                    <button className="btn btnSm btnDanger" onClick={() => remove(r)} aria-label={`Delete ${r.service_name}`}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="emptyCell">
                    No service income yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete service entry"
        message="Delete this service income record?"
        confirmLabel="Delete"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmDelete({ open: false, row: null })}
      />
    </div>
  )
}
