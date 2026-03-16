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
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Sales POS</div>
          <div className="muted">Search → select → qty → price (optional discount) → save</div>
        </div>
        <div className="row">
          <span className="pill">Total: {money(totals.total)}</span>
          <span className="pill pillOk">Profit: {money(totals.profit)}</span>
          <button className="btn btnPrimary" onClick={submit} disabled={saving || cart.length === 0}>
            Save Sale
          </button>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">1) Search Item</div>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type item name or model"
          />
          <div style={{ height: 10 }} />
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
                  style={{ cursor: 'pointer' }}
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
                  <td colSpan="4" className="muted">
                    No results
                  </td>
                </tr>
              )}
              {!search.trim() && (
                <tr>
                  <td colSpan="4" className="muted">
                    Start typing to search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="cardTitle">2) Add to Bill</div>
          {!selected && <div className="muted">Select an item from the left.</div>}
          {selected && (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {selected.item_name}{' '}
                    <span className="muted" style={{ fontWeight: 600 }}>
                      {selected.model}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Stock: {selected.quantity} • Cost: {money(selected.cost_price)} • Default selling:{' '}
                    {money(selected.selling_price)}
                  </div>
                </div>
              </div>

              <div style={{ height: 10 }} />

              <div className="grid3">
                <div>
                  <div className="muted" style={{ marginBottom: 6 }}>
                    Quantity
                  </div>
                  <input
                    className="input"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 6 }}>
                    Selling price (optional discount)
                  </div>
                  <input
                    className="input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'end' }}>
                  <button className="btn btnPrimary" onClick={addToCart}>
                    Add
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={{ height: 12 }} />

          <div className="cardTitle">Current Bill</div>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Profit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((c, idx) => {
                const lineTotal = Number(c.selling_price_each) * Number(c.quantity)
                const lineProfit = (Number(c.selling_price_each) - Number(c.cost_price)) * Number(c.quantity)
                return (
                  <tr key={`${c.item_id}-${idx}`}>
                    <td>
                      {c.item_name} <span className="muted">{c.model}</span>
                    </td>
                    <td>{c.quantity}</td>
                    <td>{money(c.selling_price_each)}</td>
                    <td>{money(lineTotal)}</td>
                    <td className="muted">{money(lineProfit)}</td>
                    <td>
                      <button
                        className="btn btnDanger"
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
                  <td colSpan="6" className="muted">
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

