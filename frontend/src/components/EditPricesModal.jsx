import { useState, useEffect } from 'react'
import Modal from './Modal'

export default function EditPricesModal({ open, item, onSave, onClose }) {
  const [selling, setSelling] = useState('')
  const [cost, setCost] = useState('')

  useEffect(() => {
    if (open && item) {
      setSelling(String(item.selling_price ?? ''))
      setCost(String(item.cost_price ?? ''))
    }
  }, [open, item])

  const handleSave = () => {
    const s = Number(selling)
    const c = Number(cost)
    if (!Number.isFinite(s) || !Number.isFinite(c)) return
    onSave?.({ selling_price: s, cost_price: c })
    onClose?.()
  }

  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} title={`Edit prices: ${item.item_name} ${item.model}`}>
      <div className="modalBody">
        <div className="formGroup">
          <label className="modalLabel" htmlFor="edit-selling">
            Selling price
          </label>
          <input
            id="edit-selling"
            type="number"
            className="input modalInput"
            value={selling}
            onChange={(e) => setSelling(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="formGroup">
          <label className="modalLabel" htmlFor="edit-cost">
            Cost price
          </label>
          <input
            id="edit-cost"
            type="number"
            className="input modalInput"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="modalActions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btnPrimary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
