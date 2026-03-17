import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api, getErrorMessage } from '../services/api'
import { shopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

export default function SalesPosPage() {
  const setToast = useToast()
  const location = useLocation()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState('')

  const [cart, setCart] = useState([])
  const [saving, setSaving] = useState(false)

  const money = (v) => `${shopConfig.currencySymbol}${Number(v || 0).toFixed(2)}`

  useEffect(() => {
    const term = search.trim()
    if (!term) {
      setResults([])
      return
    }
    const t = setTimeout(() => {
      api
        .get('/items', { params: { q: term } })
        .then((res) => setResults((res.data?.data || []).slice(0, 12)))
        .catch((e) => setToast(getErrorMessage(e)))
    }, 120)
    return () => clearTimeout(t)
  }, [search, setToast])

  useEffect(() => {
    const pre = location.state?.preselectItemId
    if (!pre) return
    api
      .get(`/items/${pre}`)
      .then((res) => {
        const it = res.data?.data
        if (it) {
          setSelected(it)
          setPrice(String(it.selling_price))
          setQty(1)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addToCart = () => {
    if (!selected) return
    const q = Number(qty)
    if (!Number.isFinite(q) || q <= 0) return

    const p = price === '' ? Number(selected.selling_price) : Number(price)
    if (!Number.isFinite(p) || p <= 0) return

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.item_id === selected.id && x.selling_price_each === p)
      if (idx >= 0) {
        const next = prev.slice()
        next[idx] = { ...next[idx], quantity: next[idx].quantity + q }
        return next
      }
      return [
        ...prev,
        {
          item_id: selected.id,
          item_name: selected.item_name,
          model: selected.model,
          quantity: q,
          selling_price_each: p,
          cost_price: Number(selected.cost_price),
        },
      ]
    })

    setSearch('')
    setResults([])
    setSelected(null)
    setPrice('')
    setQty(1)
  }

  const totals = useMemo(() => {
    let total = 0
    let profit = 0
    for (const c of cart) {
      total += Number(c.selling_price_each) * Number(c.quantity)
      profit += (Number(c.selling_price_each) - Number(c.cost_price)) * Number(c.quantity)
    }
    return { total, profit }
  }, [cart])

  const updateCartItem = (idx, updates) => {
    setCart((prev) => prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)))
  }

  const submit = async () => {
    if (cart.length === 0) return
    setSaving(true)
    try {
      await api.post('/sales', {
        sold_at: new Date().toISOString(),
        items: cart.map((c) => ({
          item_id: c.item_id,
          quantity: c.quantity,
          selling_price_each: c.selling_price_each,
        })),
      })
      setCart([])
      setToast('Sale saved')
    } catch (e) {
      setToast(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Sales POS</h1>
          <p className="pageSubtitle">Search → select → qty → price (optional discount) → save</p>
        </div>
        <div className="actionGroup">
          <span
            className="pill"
            style={{ fontSize: '1.13rem', fontWeight: 700, padding: '0.4rem 0.85rem', lineHeight: 1 }}
          >
            Total: {money(totals.total)}
          </span>
          <button className="btn btnPrimary" onClick={submit} disabled={saving || cart.length === 0}>
            Save Sale
          </button>
        </div>
      </header>

      <div className="grid2">
        <section className="card cardSection">
          <h2 className="cardTitle">1) Search item</h2>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type item name or model"
            aria-label="Search items"
          />
          <div className="tableWrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Model</th>
                <th>Qty</th>
                <th>Selling</th>
              </tr>
            </thead>
            <tbody>
              {results.map((it) => (
                <tr
                  key={it.id}
                  className="tableRowClickable"
                  onClick={() => {
                    setSelected(it)
                    setPrice(String(it.selling_price))
                    setQty(1)
                  }}
                >
                  <td>{it.item_name}</td>
                  <td className="muted">{it.model}</td>
                  <td>{it.quantity}</td>
                  <td>{money(it.selling_price)}</td>
                </tr>
              ))}
              {search.trim() && results.length === 0 && (
                <tr>
                  <td colSpan="4" className="emptyCell">
                    No results
                  </td>
                </tr>
              )}
              {!search.trim() && (
                <tr>
                  <td colSpan="4" className="emptyCell">
                    Start typing to search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </section>

        <section className="card cardSection">
          <h2 className="cardTitle">2) Add to bill</h2>
          {!selected && <p className="muted">Select an item from the left.</p>}
          {selected && (
            <>
              <div className="posSelectedInfo">
                <strong>
                  {selected.item_name} <span className="muted">{selected.model}</span>
                </strong>
                <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.9375rem' }}>
                  Stock: {selected.quantity}
                </p>
              </div>

              <div className="formGrid formGrid3" style={{ marginTop: 16 }}>
                <div className="formField">
                  <label className="formLabel" htmlFor="pos-qty">Quantity</label>
                  <input
                    id="pos-qty"
                    className="input"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="formField">
                  <label className="formLabel" htmlFor="pos-price">Selling price (optional discount)</label>
                  <input
                    id="pos-price"
                    className="input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <div className="formField" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="btn btnPrimary" onClick={addToCart}>
                    Add
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="cardTitle" style={{ marginTop: 16 }}>Current bill</div>
          <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((c, idx) => {
                const lineTotal = Number(c.selling_price_each) * Number(c.quantity)
                return (
                  <tr key={`${c.item_id}-${idx}`}>
                    <td>
                      {c.item_name} <span className="muted">{c.model}</span>
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={c.quantity}
                        onChange={(e) => {
                          const newQty = Number(e.target.value)
                          if (!Number.isFinite(newQty) || newQty < 1) return
                          updateCartItem(idx, { quantity: newQty })
                        }}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={c.selling_price_each}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value)
                          if (!Number.isFinite(newPrice) || newPrice <= 0) return
                          updateCartItem(idx, { selling_price_each: newPrice })
                        }}
                        style={{ width: 100 }}
                      />
                    </td>
                    <td>{money(lineTotal)}</td>
                    <td>
                      <button
                        className="btn btnSm btnDanger"
                        onClick={() => setCart((p) => p.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="6" className="emptyCell">
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </section>
      </div>
    </div>
  )
}

