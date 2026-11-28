import { useEffect, useRef } from 'react'

export default function InventoryDeleteDialog({
  isOpen,
  isDeleting,
  selectedCount,
  onClose,
  onConfirm,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const closeDialog = () => {
    if (isDeleting) return
    onClose()
  }

  return (
    <dialog
      className="inventory-dialog"
      ref={dialogRef}
      aria-labelledby="inventory-delete-title"
      aria-describedby="inventory-delete-description"
      onCancel={(event) => {
        event.preventDefault()
        closeDialog()
      }}
      onClose={() => {
        if (isOpen) onClose()
      }}
    >
      <div className="inventory-form">
        <div className="inventory-dialog-header">
          <h2 id="inventory-delete-title">Eliminar registros</h2>
          <button
            className="inventory-dialog-close"
            type="button"
            aria-label="Cerrar"
            onClick={closeDialog}
            disabled={isDeleting}
          >
            ×
          </button>
        </div>
        <p id="inventory-delete-description">
          ¿Seguro que deseas eliminar {selectedCount === 1
            ? 'el registro seleccionado'
            : `los ${selectedCount} registros seleccionados`}? Esta acción no se puede deshacer.
        </p>
        <div className="inventory-form-actions">
          <button
            className="inventory-form-cancel"
            type="button"
            onClick={closeDialog}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            className="inventory-form-delete"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || selectedCount === 0}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
