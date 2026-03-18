import { useState, useEffect } from 'react'
import { shopConfig, updateShopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

export default function SettingsPage() {
  const setToast = useToast()
  const [shopName, setShopName] = useState(shopConfig.name)
  const [shopCity, setShopCity] = useState(shopConfig.city)
  const [currency, setCurrency] = useState(shopConfig.currencySymbol)
  const [showFinancialData, setShowFinancialData] = useState(localStorage.getItem('showFinancialData') === 'true')
  const [stockColumns, setStockColumns] = useState(() => {
    const saved = localStorage.getItem('stock_columns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length) return parsed
      } catch {
        // ignore
      }
    }
    return ['item', 'model', 'category', 'qty', 'selling', 'total_stock_value']
  })

  useEffect(() => {
    const savedShop = localStorage.getItem('shop_config')
    if (savedShop) {
      try {
        const parsed = JSON.parse(savedShop)
        if (parsed.name) setShopName(parsed.name)
        if (parsed.city) setShopCity(parsed.city)
        if (parsed.currencySymbol) setCurrency(parsed.currencySymbol)
      } catch {
        // ignore
      }
    }
  }, [])

  const saveShopConfig = () => {
    const config = { name: shopName || 'JaiBhajarang Mobiles', city: shopCity || 'Karimnagar', currencySymbol: currency || '₹' }
    updateShopConfig(config)
    setToast('Shop settings saved')
    window.location.reload()
  }

  const saveShowFinancialData = (value) => {
    localStorage.setItem('showFinancialData', value ? 'true' : 'false')
    setShowFinancialData(value)
    setToast('Financial visibility pref saved')
  }

  const saveStockColumns = () => {
    localStorage.setItem('stock_columns', JSON.stringify(stockColumns))
    setToast('Stock columns saved')
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Settings</h1>
          <p className="pageSubtitle">Branding and app preferences</p>
        </div>
      </header>

      <section className="card cardSection">
        <div className="cardTitle">Shop details</div>
        <div className="formGrid formGrid3">
          <div className="formField">
            <label className="formLabel" htmlFor="settings-shop-name">
              Shop Name
            </label>
            <input
              id="settings-shop-name"
              className="input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="settings-shop-city">
              City
            </label>
            <input
              id="settings-shop-city"
              className="input"
              value={shopCity}
              onChange={(e) => setShopCity(e.target.value)}
            />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="settings-currency">
              Currency symbol
            </label>
            <input
              id="settings-currency"
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </div>
        <div className="actionGroup" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={saveShopConfig}>
            Save shop details
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Financial visibility</div>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={showFinancialData}
            onChange={(e) => saveShowFinancialData(e.target.checked)}
          />{' '}
          Show financial values
        </label>
        <p className="muted">When off, values display as {shopConfig.currencySymbol} ****</p>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Stock table columns</div>
        <p className="muted">Set which columns are visible in stock reports.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {[
            { id: 'item', label: 'Item' },
            { id: 'model', label: 'Model' },
            { id: 'category', label: 'Category' },
            { id: 'qty', label: 'Qty' },
            { id: 'cost', label: 'Cost' },
            { id: 'selling', label: 'Selling' },
            { id: 'total_stock_value', label: 'Total Stock Value' },
          ].map((col) => (
            <label key={col.id} style={{ display: 'block', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={stockColumns.includes(col.id)}
                onChange={() => {
                  const next = stockColumns.includes(col.id)
                    ? stockColumns.filter((c) => c !== col.id)
                    : [...stockColumns, col.id]
                  setStockColumns(next)
                }}
              />{' '}
              {col.label}
            </label>
          ))}
        </div>
        <div className="actionGroup" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={saveStockColumns}>
            Save column settings
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Application controls</div>
        <button
          className="btn btnDanger"
          onClick={() => {
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
          }}
        >
          Reset Application Data
        </button>
      </section>
    </div>
  )
}
