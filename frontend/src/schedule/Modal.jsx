import { useEffect, useId } from 'react'

// pop-up centrado sobre un fondo oscuro; se cierra con la x, con Escape o haciendo click fuera
export default function Modal({ title, onClose, children }) {
  const titleId = useId()

  // Escape se escucha en todo el documento: si el foco se pierde (ej: un boton que se deshabilita) igual cierra
  // el reloj y el buscador de personas detienen su propio Escape para cerrar solo su lista
  useEffect(() => {
    const cerrarConEscape = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', cerrarConEscape)
    return () => document.removeEventListener('keydown', cerrarConEscape)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
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
