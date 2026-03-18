import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { downloadBlob } from '../services/download'
import { useToast } from '../components/useToast'
import ConfirmDialog from '../components/ConfirmDialog'
import PromptDialog from '../components/PromptDialog'

export default function CategoriesPage() {
  const setToast = useToast()
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const [confirmState, setConfirmState] = useState({ open: false, cat: null })
  const [promptState, setPromptState] = useState({ open: false, cat: null, value: '' })

  const load = () =>
    api
      .get('/categories', { params: { page, pageSize } })
      .then((res) => {
        setCategories(res.data?.data || [])
        setTotalCount(res.data?.meta?.count || 0)
      })
      .catch((e) => setToast(getErrorMessage(e)))

  useEffect(() => {
    load()
  }, [page, pageSize])

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

  const rename = (cat) => {
    setPromptState({ open: true, cat, value: cat.name })
  }

  const handleRenameSubmit = async (trimmed) => {
    if (!trimmed || !promptState.cat) return
    try {
      await api.put(`/categories/${promptState.cat.id}`, { name: trimmed })
      await load()
      setToast('Category updated')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  const remove = (cat) => {
    setConfirmState({ open: true, cat })
  }

  const handleRemoveConfirm = async () => {
    if (!confirmState.cat) return
    try {
      await api.delete(`/categories/${confirmState.cat.id}`)
      await load()
      setToast('Category deleted')
    } catch (e) {
      setToast(getErrorMessage(e))
    }
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Categories</h1>
          <p className="pageSubtitle">Create, edit, delete categories</p>
        </div>
        <div className="actionGroup">
          <button className="btn" onClick={async () => {
            try {
              const res = await api.get('/excel/export/categories-template', { responseType: 'blob' })
              downloadBlob(res.data, 'categories-template.xlsx')
              setToast('Template downloaded')
            } catch (e) {
              setToast(getErrorMessage(e))
            }
          }}>
            Download categories template
          </button>
          <button className="btn" onClick={async () => {
            try {
              const res = await api.get('/excel/export/categories', { responseType: 'blob' })
              downloadBlob(res.data, 'categories.xlsx')
              setToast('Categories export complete')
            } catch (e) {
              setToast(getErrorMessage(e))
            }
          }}>
            Export categories
          </button>
          <label className="btn btnFile">
            Import categories
            <input
              type="file"
              accept=".xlsx"
              className="srOnly"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                const fd = new FormData()
                fd.append('file', f)
                try {
                  await api.post('/excel/import/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                  await load()
                  setToast('Categories imported')
                } catch (err) {
                  setToast(getErrorMessage(err))
                }
              }}
            />
          </label>
        </div>
      </header>

      <section className="card cardSection">
        <h2 className="srOnly">Add category</h2>
        <div className="formRow">
          <input
            className="input inputMd"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
            aria-label="New category name"
          />
          <button className="btn btnPrimary" onClick={add} disabled={saving}>
            Add
          </button>
        </div>
      </section>

      <section className="card cardSection">
        <h2 className="cardTitle">Category list</h2>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="colActions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <div className="actionGroup">
                      <button className="btn btnSm" onClick={() => rename(c)} aria-label={`Edit ${c.name}`}>
                        Edit
                      </button>
                      <button className="btn btnSm btnDanger" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan="2" className="emptyCell">
                    No categories yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="paginationRow">
          <div>
            <label>
              Rows per page:
              <select value={pageSize} onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}>
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <span>{totalCount} total</span>
            <button className="btn btnSm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <button className="btn btnSm" disabled={page * pageSize >= totalCount} onClick={() => setPage((p) => p + 1)}>Next</button>
            <span>Page {page}</span>
          </div>
        </div>

        <p className="cardNote">A category cannot be deleted if items exist in it.</p>
      </section>

      <PromptDialog
        open={promptState.open}
        title="Edit category name"
        label="New name"
        defaultValue={promptState.value}
        submitLabel="Save"
        onSubmit={handleRenameSubmit}
        onCancel={() => setPromptState({ open: false, cat: null, value: '' })}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete category"
        message={`Delete category "${confirmState.cat?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmState({ open: false, cat: null })}
      />
    </div>
  )
}
