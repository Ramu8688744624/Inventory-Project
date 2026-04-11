import { useEffect, useMemo, useState } from 'react'
import { api, getErrorMessage } from '../services/api'
import { downloadBlob } from '../services/download'
import { useToast } from '../components/useToast'
import ConfirmDialog from '../components/ConfirmDialog'
import PaginationControls from '../components/PaginationControls'
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
          <button className="btnIcon btnIconPrimary" onClick={async () => {
            try {
              const res = await api.get('/excel/export/categories-template', { responseType: 'blob' })
              downloadBlob(res.data, 'categories-template.xlsx')
              setToast('Template downloaded')
            } catch (e) {
              setToast(getErrorMessage(e))
            }
          }} title="Download categories template" aria-label="Download categories template">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button className="btnIcon btnIconPrimary" onClick={async () => {
            try {
              const res = await api.get('/excel/export/categories', { responseType: 'blob' })
              downloadBlob(res.data, 'categories.xlsx')
              setToast('Categories export complete')
            } catch (e) {
              setToast(getErrorMessage(e))
            }
          }} title="Export categories" aria-label="Export categories to Excel">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <label className="btnIcon btnIconPrimary" title="Import categories" style={{cursor: 'pointer'}}>
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
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
                      <button className="btnIcon" onClick={() => rename(c)} title={`Edit ${c.name}`} aria-label={`Edit ${c.name}`}>
                        <svg viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3"/></svg>
                      </button>
                      <button className="btnIcon btnIconDanger" onClick={() => remove(c)} title={`Delete ${c.name}`} aria-label={`Delete ${c.name}`}>
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
