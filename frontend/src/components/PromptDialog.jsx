import { useState, useEffect } from 'react'
import Modal from './Modal'

export default function PromptDialog({
  open,
  title = 'Enter value',
  label,
  defaultValue = '',
  placeholder,
  inputType = 'text',
  inputMode,
  submitLabel = 'OK',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (open) setValue(defaultValue)
  }, [open, defaultValue])

  const handleSubmit = () => {
    const trimmed = typeof value === 'string' ? value.trim() : String(value ?? '')
    onSubmit?.(trimmed)
    onCancel?.()
  }

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="modalBody">
        {label && (
          <label className="modalLabel" htmlFor="prompt-input">
            {label}
          </label>
        )}
        <input
          id="prompt-input"
          type={inputType}
          inputMode={inputMode}
          className="input modalInput"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          autoFocus
        />
        <div className="modalActions">
          <button type="button" className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btnPrimary" onClick={handleSubmit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
