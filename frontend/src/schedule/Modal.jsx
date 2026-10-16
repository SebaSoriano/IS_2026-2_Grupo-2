import { useId } from 'react'

// pop-up centrado sobre un fondo oscuro; se cierra con la x, con Escape o haciendo click fuera
export default function Modal({ title, onClose, children }) {
  const titleId = useId()

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
      >
        <header className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
