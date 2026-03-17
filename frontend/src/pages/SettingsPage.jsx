import { shopConfig } from '../services/shopConfig'

export default function SettingsPage() {
  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Settings</h1>
          <p className="pageSubtitle">Branding and configuration</p>
        </div>
      </header>

      <section className="card cardSection">
        <div className="cardTitle">Branding</div>
        <p className="muted" style={{ marginBottom: 16 }}>
          Edit <code>frontend/src/services/shopConfig.js</code> to change shop name, city, and currency.
        </p>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Setting</th>
                <th>Current value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="muted">Shop name</td>
                <td>{shopConfig.name}</td>
              </tr>
              <tr>
                <td className="muted">City</td>
                <td>{shopConfig.city}</td>
              </tr>
              <tr>
                <td className="muted">Currency</td>
                <td>{shopConfig.currencySymbol}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="cardNote">
          API base URL can be changed via <code>VITE_API_BASE_URL</code> in <code>frontend/.env</code>.
        </p>
      </section>
    </div>
  )
}
