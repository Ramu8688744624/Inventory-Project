import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { downloadBlob } from '../services/download'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'
import ConfirmDialog from '../components/ConfirmDialog'
import PromptDialog from '../components/PromptDialog'
import AlertDialog from '../components/AlertDialog'
import EditPricesModal from '../components/EditPricesModal'
import PaginationControls from '../components/PaginationControls'
import CustomSelect from '../components/CustomSelect'

export default function InventoryPage() {
  const setToast = useToast()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const defaultInventoryColumns = ['item', 'model', 'category', 'qty', 'cost', 'selling', 'actions']
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('inventory_columns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length) return parsed
      } catch {
        // ignore
      }
    }
    return defaultInventoryColumns
  })

  const [form, setForm] = useState({
    category_id: '',
    item_name: '',
    model: '',
    cost_price: '',
    selling_price: '',
    quantity: '0',
  })
  const [saving, setSaving] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState({ open: false, item: null })
  const [promptStock, setPromptStock] = useState({ open: false, item: null })
  const [editPrices, setEditPrices] = useState({ open: false, item: null })
  const [alertSales, setAlertSales] = useState({ open: false, message: '' })

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  const loadCategories = () =>
    api
      .get('/categories', { params: { pageSize: 1000 } })
      .then((res) => setCategories(res.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  const loadItems = () =>
    api
      .get('/items', { params: { categoryId: filterCategoryId || undefined, q: q || undefined, page, pageSize } })
      .then((res) => {
        setItems(res.data?.data || [])
        setTotalCount(res.data?.meta?.count || 0)
      })
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadItems()
  }, [filterCategoryId, q, page, pageSize])

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

  const editItem = (it) => {
    setEditPrices({ open: true, item: it })
  }

  const handleEditPricesSave = async (prices) => {
    if (!editPrices.item) return
    try {
      await api.put(`/items/${editPrices.item.id}`, prices)
      await loadItems()
      setToast('Item updated')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const addStock = (it) => {
    setPromptStock({ open: true, item: it })
  }

  const handleAddStockSubmit = async (qtyStr) => {
    if (!promptStock.item || !qtyStr) return
    try {
      await api.post(`/items/${promptStock.item.id}/add-stock`, { quantity: Number(qtyStr), note: 'Manual stock add' })
      await loadItems()
      setToast('Stock updated')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const removeItem = (it) => {
    setConfirmDelete({ open: true, item: it })
  }

  const handleRemoveConfirm = async () => {
    if (!confirmDelete.item) return
    try {
      await api.delete(`/items/${confirmDelete.item.id}`)
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
      setToast('Export complete')
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
      setAlertSales({ open: true, message: lines || 'No sales yet' })
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const categoryOptions = useMemo(() => {
    const list = categories.filter((c) => c.name && c.name.trim())
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Inventory</h1>
          <p className="pageSubtitle">Add items, update prices, add stock, Excel import/export</p>
        </div>
        <div className="actionGroup">
          <button className="btn" onClick={exportInventory}>
            Export Excel
          </button>
          <button className="btn" onClick={async () => {
            try {
              const res = await api.get('/excel/export/inventory-template', { responseType: 'blob' })
              downloadBlob(res.data, 'inventory-template.xlsx')
              setToast('Template downloaded')
            } catch (e) {
              setToast(getErrorMessage(e))
            }
          }}>
            Download inventory template
          </button>
          <label className="btn btnFile">
            Import Excel
            <input
              type="file"
              accept=".xlsx"
              className="srOnly"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) importInventory(f)
              }}
            />
          </label>
        </div>
      </header>

      <section className="card cardSection">
        <h2 className="cardTitle">Add new item</h2>
        <div className="formGrid formGrid3">
          <div className="formField">
            <label className="formLabel" htmlFor="inv-cat">
              Category
            </label>
            <CustomSelect
              id="inv-cat"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              options={categoryOptions}
              placeholder="Select category"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="inv-name">
              Item name
            </label>
            <input
              id="inv-name"
              className="input"
              value={form.item_name}
              onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))}
              placeholder="e.g. iPhone"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="inv-model">
              Model
            </label>
            <input
              id="inv-model"
              className="input"
              value={form.model}
              onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="e.g. 13 Pro"
            />
          </div>
        </div>
        <div className="formGrid formGrid3">
          <div className="formField">
            <label className="formLabel" htmlFor="inv-cost">
              Cost price
            </label>
            <input
              id="inv-cost"
              className="input"
              value={form.cost_price}
              onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))}
              placeholder="e.g. 50000"
              inputMode="decimal"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="inv-selling">
              Selling price
            </label>
            <input
              id="inv-selling"
              className="input"
              value={form.selling_price}
              onChange={(e) => setForm((p) => ({ ...p, selling_price: e.target.value }))}
              placeholder="e.g. 55000"
              inputMode="decimal"
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="inv-qty">
              Quantity
            </label>
            <input
              id="inv-qty"
              className="input"
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              placeholder="e.g. 10"
              inputMode="numeric"
            />
          </div>
        </div>
        <div className="formRow formRowNote">
          <button className="btn btnPrimary" onClick={addItem} disabled={saving}>
            Add item
          </button>
          <span className="muted">Item Name + Model must be unique.</span>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardHeader">
          <h2 className="cardTitle">Item list</h2>
          <div className="filterRow">
            <select
              className="select selectSm"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className="input inputSm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by item/model"
              aria-label="Search items"
            />
            <button className="btn btnSm" onClick={loadItems}>
              Refresh
            </button>
          </div>
        </div>
        <p className="muted cardMeta">
          Showing {filtered.length} of {totalCount} items
          (page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))})
        </p>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                {visibleColumns.includes('item') && <th>Item</th>}
                {visibleColumns.includes('model') && <th>Model</th>}
                {visibleColumns.includes('category') && <th>Category</th>}
                {visibleColumns.includes('qty') && <th>Qty</th>}
                {visibleColumns.includes('cost') && <th>Cost</th>}
                {visibleColumns.includes('selling') && <th>Selling</th>}
                {visibleColumns.includes('actions') && <th className="colActions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id}>
                  {visibleColumns.includes('item') && <td>{it.item_name}</td>}
                  {visibleColumns.includes('model') && <td className="muted">{it.model}</td>}
                  {visibleColumns.includes('category') && <td className="muted">{it.category?.name}</td>}
                  {visibleColumns.includes('qty') && (
                    <td>
                      {it.quantity === 0 ? (
                        <span className="pill pillDanger">0</span>
                      ) : (
                        <span className="pill">{it.quantity}</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.includes('cost') && <td className="muted">{money(it.cost_price)}</td>}
                  {visibleColumns.includes('selling') && <td>{money(it.selling_price)}</td>}
                  {visibleColumns.includes('actions') && (
                    <td>
                      <div className="actionGroup actionGroupWrap">
                        <button className="btn btnSm" onClick={() => addStock(it)}>
                          Add stock
                        </button>
                        <button className="btn btnSm" onClick={() => editItem(it)}>
                          Edit prices
                        </button>
                        <button className="btn btnSm" onClick={() => viewItemSales(it)}>
                          Item sales
                        </button>
                        <button className="btn btnSm btnDanger" onClick={() => removeItem(it)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length || 1} className="emptyCell">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          total={totalCount}
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
        title="Delete item"
        message={`Delete "${confirmDelete.item?.item_name} ${confirmDelete.item?.model}"?`}
        confirmLabel="Delete"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmDelete({ open: false, item: null })}
      />

      <PromptDialog
        open={promptStock.open}
        title="Add stock"
        label={`Quantity to add for ${promptStock.item?.item_name} ${promptStock.item?.model}`}
        defaultValue="1"
        inputType="number"
        inputMode="numeric"
        submitLabel="Add"
        onSubmit={handleAddStockSubmit}
        onCancel={() => setPromptStock({ open: false, item: null })}
      />

      <EditPricesModal
        open={editPrices.open}
        item={editPrices.item}
        onSave={handleEditPricesSave}
        onClose={() => setEditPrices({ open: false, item: null })}
      />

      <AlertDialog
        open={alertSales.open}
        title="Item sales history"
        message={alertSales.message}
        onClose={() => setAlertSales({ open: false, message: '' })}
      />
    </div>
  )
}
