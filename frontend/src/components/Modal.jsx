import { useEffect } from 'react'

/**
 * Base modal with overlay. Theme-aware, animated, accessible.
 */
export default function Modal({ open, onClose, children, title, 'aria-labelledby': ariaLabelledBy }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy || (title ? 'modal-title' : undefined)}
    >
      <div className="modalBackdrop" onClick={onClose} aria-hidden="true" />
      <div className="modalContent">
        {title && (
          <h2 id="modal-title" className="modalTitle">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
