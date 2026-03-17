import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="modalBody">
        <p className="modalMessage">{message}</p>
        <div className="modalActions">
          <button type="button" className="btn" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'btn btnDanger' : 'btn btnPrimary'}
            onClick={() => {
              onConfirm?.()
              onCancel?.()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
