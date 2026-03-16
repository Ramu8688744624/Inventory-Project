import { shopConfig } from '../services/shopConfig'

export default function SettingsPage() {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Settings</div>
      <div className="muted" style={{ marginBottom: 12 }}>
        This lightweight version keeps branding in the frontend config for now.
      </div>

      <div className="card">
        <div className="cardTitle">Branding</div>
        <div className="muted">Edit `frontend/src/services/shopConfig.js`</div>
        <div style={{ height: 10 }} />
        <table className="table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="muted">Shop Name</td>
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
        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          API base URL can be changed via `VITE_API_BASE_URL` in `frontend/.env`.
        </div>
      </div>
    </div>
  )
}

