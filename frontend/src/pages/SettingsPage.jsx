import { useState, useEffect } from 'react'
import { shopConfig, updateShopConfig } from '../services/shopConfig'
import { useToast } from '../components/useToast'

export default function SettingsPage() {
  const setToast = useToast()
  const [shopName, setShopName] = useState(shopConfig.name)
  const [shopCity, setShopCity] = useState(shopConfig.city)
  const [currency, setCurrency] = useState(shopConfig.currencySymbol)
  const [showFinancialData, setShowFinancialData] = useState(localStorage.getItem('showFinancialData') === 'true')

  const loadColumns = (key, defaultColumns) => {
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length) return parsed
      } catch {
        // ignore
      }
    }
    return defaultColumns
  }

  const [stockColumns, setStockColumns] = useState(() =>
    loadColumns('stock_columns', ['item', 'model', 'category', 'qty', 'cost', 'selling', 'total_stock_value'])
  )
  const [inventoryColumns, setInventoryColumns] = useState(() =>
    loadColumns('inventory_columns', ['item', 'model', 'category', 'qty', 'cost', 'selling', 'actions'])
  )
  const [salesColumns, setSalesColumns] = useState(() =>
    loadColumns('sales_history_columns', ['date', 'item', 'category', 'qty', 'selling', 'profit'])
  )
  const [profitCategoryColumns, setProfitCategoryColumns] = useState(() =>
    loadColumns('profit_category_columns', ['category', 'qty', 'sales', 'profit'])
  )
  const [profitItemColumns, setProfitItemColumns] = useState(() =>
    loadColumns('profit_item_columns', ['item', 'qty', 'sales', 'profit'])
  )

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

  const saveColumns = (key, columns, message) => {
    localStorage.setItem(key, JSON.stringify(columns))
    setToast(message)
  }

  const saveStockColumns = () => saveColumns('stock_columns', stockColumns, 'Stock columns saved')
  const saveInventoryColumns = () => saveColumns('inventory_columns', inventoryColumns, 'Inventory columns saved')
  const saveSalesColumns = () => saveColumns('sales_history_columns', salesColumns, 'Sales history columns saved')
  const saveProfitCategoryColumns = () => saveColumns('profit_category_columns', profitCategoryColumns, 'Profit category columns saved')
  const saveProfitItemColumns = () => saveColumns('profit_item_columns', profitItemColumns, 'Profit item columns saved')

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
            Save stock columns
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Inventory table columns</div>
        <p className="muted">Set which columns are visible in inventory list.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {[
            { id: 'item', label: 'Item' },
            { id: 'model', label: 'Model' },
            { id: 'category', label: 'Category' },
            { id: 'qty', label: 'Qty' },
            { id: 'cost', label: 'Cost' },
            { id: 'selling', label: 'Selling' },
            { id: 'actions', label: 'Actions' },
          ].map((col) => (
            <label key={col.id} style={{ display: 'block', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={inventoryColumns.includes(col.id)}
                onChange={() => {
                  const next = inventoryColumns.includes(col.id)
                    ? inventoryColumns.filter((c) => c !== col.id)
                    : [...inventoryColumns, col.id]
                  setInventoryColumns(next)
                }}
              />{' '}
              {col.label}
            </label>
          ))}
        </div>
        <div className="actionGroup" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={saveInventoryColumns}>
            Save inventory columns
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Sales history table columns</div>
        <p className="muted">Set which columns are visible in sales history.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {[
            { id: 'date', label: 'Date' },
            { id: 'item', label: 'Item' },
            { id: 'category', label: 'Category' },
            { id: 'qty', label: 'Qty' },
            { id: 'selling', label: 'Selling' },
            { id: 'profit', label: 'Profit' },
          ].map((col) => (
            <label key={col.id} style={{ display: 'block', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={salesColumns.includes(col.id)}
                onChange={() => {
                  const next = salesColumns.includes(col.id)
                    ? salesColumns.filter((c) => c !== col.id)
                    : [...salesColumns, col.id]
                  setSalesColumns(next)
                }}
              />{' '}
              {col.label}
            </label>
          ))}
        </div>
        <div className="actionGroup" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={saveSalesColumns}>
            Save sales history columns
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Profit report columns (category)</div>
        <p className="muted">Set visible columns for category profit table.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {[
            { id: 'category', label: 'Category' },
            { id: 'qty', label: 'Qty' },
            { id: 'sales', label: 'Sales' },
            { id: 'profit', label: 'Profit' },
          ].map((col) => (
            <label key={col.id} style={{ display: 'block', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={profitCategoryColumns.includes(col.id)}
                onChange={() => {
                  const next = profitCategoryColumns.includes(col.id)
                    ? profitCategoryColumns.filter((c) => c !== col.id)
                    : [...profitCategoryColumns, col.id]
                  setProfitCategoryColumns(next)
                }}
              />{' '}
              {col.label}
            </label>
          ))}
        </div>
        <div className="actionGroup" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={saveProfitCategoryColumns}>
            Save profit category columns
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <div className="cardTitle">Profit report columns (item)</div>
        <p className="muted">Set visible columns for item profit table.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          {[
            { id: 'item', label: 'Item' },
            { id: 'qty', label: 'Qty' },
            { id: 'sales', label: 'Sales' },
            { id: 'profit', label: 'Profit' },
          ].map((col) => (
            <label key={col.id} style={{ display: 'block', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={profitItemColumns.includes(col.id)}
                onChange={() => {
                  const next = profitItemColumns.includes(col.id)
                    ? profitItemColumns.filter((c) => c !== col.id)
                    : [...profitItemColumns, col.id]
                  setProfitItemColumns(next)
                }}
              />{' '}
              {col.label}
            </label>
          ))}
        </div>
        <div className="actionGroup" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={saveProfitItemColumns}>
            Save profit item columns
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
