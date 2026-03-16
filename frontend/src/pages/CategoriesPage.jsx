import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { useToast } from '../components/useToast'

export default function CategoriesPage() {
  const setToast = useToast()
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    api
      .get('/categories')
      .then((res) => setCategories(res.data?.data || []))
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [])

  const sorted = useMemo(() => categories.slice().sort((a, b) => a.name.localeCompare(b.name)), [categories])

  const add = async () => {
    const n = name.trim()
    if (!n) return
    setSaving(true)
    try {
      await api.post('/categories', { name: n })
      setName('')
      await load()
      setToast('Category created')
    } catch (e) {
      setToast(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const rename = async (cat) => {
    const n = window.prompt('New category name', cat.name)
    if (n === null) return
    const trimmed = n.trim()
    if (!trimmed) return
    try {
      await api.put(`/categories/${cat.id}`, { name: trimmed })
      await load()
      setToast('Category updated')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const remove = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return
    try {
      await api.delete(`/categories/${cat.id}`)
      await load()
      setToast('Category deleted')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Categories</div>
          <div className="muted">Create, edit, delete categories</div>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <input
            className="input"
            style={{ maxWidth: 360 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
          />
          <button className="btn btnPrimary" onClick={add} disabled={saving}>
            Add
          </button>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  <div className="row">
                    <button className="btn" onClick={() => rename(c)}>
                      Edit
                    </button>
                    <button className="btn btnDanger" onClick={() => remove(c)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan="2" className="muted">
                  No categories yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Note: A category cannot be deleted if items exist in it.
        </div>
      </div>
    </div>
  )
}

