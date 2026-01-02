import { IconCheck, IconX, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import './Toast.css'

export function Toast({ message, type = 'info', onClose }) {
  const icons = {
    success: <IconCheck size={20} />,
    error: <IconX size={20} />,
    warning: <IconAlertCircle size={20} />,
    info: <IconInfoCircle size={20} />
  }

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <div className="toast-icon">
        {icons[type]}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        <IconX size={16} />
      </button>
    </div>
  )
}
