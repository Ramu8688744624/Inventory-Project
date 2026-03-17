import Modal from './Modal'

export default function AlertDialog({ open, title = 'Info', message, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="modalBody">
        <div className="modalMessage modalMessagePre">{message}</div>
        <div className="modalActions">
          <button type="button" className="btn btnPrimary" onClick={onClose} autoFocus>
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}
