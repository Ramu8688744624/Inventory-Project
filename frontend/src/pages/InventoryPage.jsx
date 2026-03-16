import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { downloadBlob } from '../services/download'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

export default function InventoryPage() {
  const setToast = useToast()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [q, setQ] = useState('')

  const [form, setForm] = useState({
    category_id: '',
    item_name: '',
    model: '',
    cost_price: '',
    selling_price: '',
    quantity: '0',
  })
  const [saving, setSaving] = useState(false)

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  const loadCategories = () =>
    api
      .get('/categories')
      .then((res) => setCategories(res.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  const loadItems = () =>
    api
      .get('/items', { params: { categoryId: filterCategoryId || undefined, q: q || undefined } })
      .then((res) => setItems(res.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadItems()
  }, [filterCategoryId])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (i) =>
        String(i.item_name).toLowerCase().includes(term) ||
        String(i.model).toLowerCase().includes(term)
    )
  }, [items, q])

  const addItem = async () => {
    setSaving(true)
    try {
      await api.post('/items', {
        category_id: Number(form.category_id),
        item_name: form.item_name,
        model: form.model,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        quantity: Number(form.quantity),
      })
      setForm({
        category_id: '',
        item_name: '',
        model: '',
        cost_price: '',
        selling_price: '',
        quantity: '0',
      })
      await loadItems()
      setToast('Item added')
    } catch (e) {
      setToast(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const editItem = async (it) => {
    const selling = window.prompt('Selling price', String(it.selling_price))
    if (selling === null) return
    const cost = window.prompt('Cost price', String(it.cost_price))
    if (cost === null) return
    try {
      await api.put(`/items/${it.id}`, {
        selling_price: Number(selling),
        cost_price: Number(cost),
      })
      await loadItems()
      setToast('Item updated')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const addStock = async (it) => {
    const qty = window.prompt(`Add stock quantity for ${it.item_name} ${it.model}`, '1')
    if (qty === null) return
    try {
      await api.post(`/items/${it.id}/add-stock`, { quantity: Number(qty), note: 'Manual stock add' })
      await loadItems()
      setToast('Stock updated')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const removeItem = async (it) => {
    if (!window.confirm(`Delete item "${it.item_name} ${it.model}"?`)) return
    try {
      await api.delete(`/items/${it.id}`)
      await loadItems()
      setToast('Item deleted')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const exportInventory = async () => {
    try {
      const res = await api.get('/excel/export/inventory', { responseType: 'blob' })
      downloadBlob(res.data, 'inventory.xlsx')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const importInventory = async (file) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/excel/import/inventory', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await loadCategories()
      await loadItems()
      setToast('Excel import completed')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const viewItemSales = async (it) => {
    try {
      const res = await api.get(`/sales/item/${it.id}/history`, { params: { limit: 50 } })
      const rows = res.data?.data || []
      const lines = rows
        .slice(0, 12)
        .map((r) => {
          const dt = new Date(r.sale?.sold_at || r.created_at)
          return `${dt.toLocaleString()} • qty ${r.quantity} • profit ${money(r.line_profit)}`
        })
        .join('\n')
      window.alert(lines || 'No sales yet')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Inventory</div>
          <div className="muted">Add items, update prices, add stock, Excel import/export</div>
        </div>
        <div className="row">
          <button className="btn" onClick={exportInventory}>
            Export Excel
          </button>
          <label className="btn">
            Import Excel
            <input
              type="file"
              accept=".xlsx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) importInventory(f)
              }}
            />
          </label>
        </div>
      </div>

      <div className="card">
        <div className="grid3">
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Category
            </div>
            <select
              className="select"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Item Name
            </div>
            <input
              className="input"
              value={form.item_name}
              onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))}
              placeholder="e.g. iPhone"
            />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Model
            </div>
            <input
              className="input"
              value={form.model}
              onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="e.g. 13 Pro"
            />
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div className="grid3">
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Cost Price
            </div>
            <input
              className="input"
              value={form.cost_price}
              onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))}
              placeholder="e.g. 50000"
            />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Selling Price
            </div>
            <input
              className="input"
              value={form.selling_price}
              onChange={(e) => setForm((p) => ({ ...p, selling_price: e.target.value }))}
              placeholder="e.g. 55000"
            />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>
              Quantity
            </div>
            <input
              className="input"
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              placeholder="e.g. 10"
            />
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div className="row">
          <button className="btn btnPrimary" onClick={addItem} disabled={saving}>
            Add Item
          </button>
          <div className="muted" style={{ fontSize: 12 }}>
            Rule: Item Name + Model must be unique.
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="row">
            <select
              className="select"
              style={{ maxWidth: 240 }}
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              style={{ maxWidth: 260 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by item/model"
            />
            <button className="btn" onClick={loadItems}>
              Refresh
            </button>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Showing {filtered.length} items
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Model</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Cost</th>
              <th>Selling</th>
              <th style={{ width: 360 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id}>
                <td>{it.item_name}</td>
                <td className="muted">{it.model}</td>
                <td className="muted">{it.category?.name}</td>
                <td>
                  {it.quantity === 0 ? (
                    <span className="pill pillDanger">0</span>
                  ) : (
                    <span className="pill">{it.quantity}</span>
                  )}
                </td>
                <td className="muted">{money(it.cost_price)}</td>
                <td>{money(it.selling_price)}</td>
                <td>
                  <div className="row">
                    <button className="btn" onClick={() => addStock(it)}>
                      Add Stock
                    </button>
                    <button className="btn" onClick={() => editItem(it)}>
                      Edit Prices
                    </button>
                    <button className="btn" onClick={() => viewItemSales(it)}>
                      Item Sales
                    </button>
                    <button className="btn btnDanger" onClick={() => removeItem(it)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

