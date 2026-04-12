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
  const [editingId, setEditingId] = useState(null)
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

  const resetForm = () => {
    setForm({ service_name: '', amount: '', service_date: ymd(new Date()), notes: '' })
    setEditingId(null)
  }

  const edit = (row) => {
    setForm({
      service_name: row.service_name,
      amount: String(row.amount),
      service_date: row.service_date,
      notes: row.notes || '',
    })
    setEditingId(row.id)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editingId) {
        // Update existing
        await api.put(`/services/${editingId}`, {
          service_name: form.service_name,
          amount: Number(form.amount),
          service_date: form.service_date,
          notes: form.notes || null,
        })
        setToast('Service income updated')
      } else {
        // Add new
        await api.post('/services', {
          service_name: form.service_name,
          amount: Number(form.amount),
          service_date: form.service_date,
          notes: form.notes || null,
        })
        setToast('Service income saved')
      }
      resetForm()
      await load()
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
      setConfirmDelete({ open: false, row: null })
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
        <h2 className="cardTitle">{editingId ? 'Edit service income' : 'Add service income'}</h2>
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
        <div className="actionGroup">
          <button className="btn btnPrimary" onClick={save} disabled={saving}>
            {editingId ? 'Update' : 'Save'}
          </button>
          {editingId && (
            <button className="btn" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
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
                    <div className="actionGroup actionGroupWrap">
                      <button className="btnIcon" onClick={() => edit(r)} title="Edit" aria-label={`Edit ${r.service_name}`}>
                        <svg viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3"/></svg>
                      </button>
                      <button className="btnIcon btnIconDanger" onClick={() => remove(r)} title="Delete" aria-label={`Delete ${r.service_name}`}>
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
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
