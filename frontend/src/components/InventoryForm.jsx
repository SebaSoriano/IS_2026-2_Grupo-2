import { useEffect, useRef, useState } from 'react'
import { crearInsumo } from '../services/api.js'
import './InventoryForm.css'

const EMPTY_FORM = {
  tipo_insumo: '',
  fecha_ingreso: '',
  fecha_vencimiento: '',
  descripcion: '',
  cantidad: '',
  rut_usuario: '',
}

export default function InventoryForm({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const updateFormField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setFormErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
  }

  const closeForm = () => {
    if (isSubmitting) return
    setForm(EMPTY_FORM)
    setFormErrors({})
    setFormError('')
    onClose()
  }

  const submitInsumo = async (event) => {
    event.preventDefault()
    setFormErrors({})
    setFormError('')
    setIsSubmitting(true)

    const payload = {
      tipo_insumo: form.tipo_insumo.trim(),
      fecha_ingreso: form.fecha_ingreso,
      fecha_vencimiento: form.fecha_vencimiento || null,
      descripcion: form.descripcion.trim() || null,
      cantidad: Number(form.cantidad),
      rut_usuario: form.rut_usuario.trim(),
    }

    try {
      const insumoCreado = await crearInsumo(payload)
      onCreated(insumoCreado)
      setForm(EMPTY_FORM)
      onClose()
    } catch (submitError) {
      const errorsByField = {}
      for (const detail of submitError.details ?? []) {
        if (detail.campo) errorsByField[detail.campo] = detail.mensaje
      }
      setFormErrors(errorsByField)
      setFormError(
        submitError.details?.length
          ? 'Revisa los campos marcados.'
          : submitError.message,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      className="inventory-dialog"
      ref={dialogRef}
      aria-labelledby="inventory-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        closeForm()
      }}
      onClose={() => {
        if (isOpen) onClose()
      }}
    >
      <form className="inventory-form" onSubmit={submitInsumo}>
        <div className="inventory-dialog-header">
          <h2 id="inventory-dialog-title">Registrar insumo</h2>
          <button
            className="inventory-dialog-close"
            type="button"
            aria-label="Cerrar"
            onClick={closeForm}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {formError && (
          <p className="inventory-form-error" role="alert">
            {formError}
          </p>
        )}

        <label className="inventory-form-field">
          Tipo de insumo
          <input
            name="tipo_insumo"
            value={form.tipo_insumo}
            onChange={updateFormField}
            maxLength={100}
            required
            aria-invalid={Boolean(formErrors.tipo_insumo)}
          />
          {formErrors.tipo_insumo && (
            <span className="inventory-form-error">
              {formErrors.tipo_insumo}
            </span>
          )}
        </label>

        <label className="inventory-form-field">
          Cantidad
          <input
            name="cantidad"
            type="number"
            min="0"
            step="1"
            value={form.cantidad}
            onChange={updateFormField}
            required
            aria-invalid={Boolean(formErrors.cantidad)}
          />
          {formErrors.cantidad && (
            <span className="inventory-form-error">{formErrors.cantidad}</span>
          )}
        </label>

        <label className="inventory-form-field">
          Fecha de ingreso
          <input
            name="fecha_ingreso"
            type="date"
            value={form.fecha_ingreso}
            onChange={updateFormField}
            required
            aria-invalid={Boolean(formErrors.fecha_ingreso)}
          />
          {formErrors.fecha_ingreso && (
            <span className="inventory-form-error">
              {formErrors.fecha_ingreso}
            </span>
          )}
        </label>

        <label className="inventory-form-field">
          Fecha de vencimiento (opcional)
          <input
            name="fecha_vencimiento"
            type="date"
            value={form.fecha_vencimiento}
            onChange={updateFormField}
            aria-invalid={Boolean(formErrors.fecha_vencimiento)}
          />
          {formErrors.fecha_vencimiento && (
            <span className="inventory-form-error">
              {formErrors.fecha_vencimiento}
            </span>
          )}
        </label>

        <label className="inventory-form-field">
          Descripción (opcional)
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={updateFormField}
            maxLength={255}
            rows={3}
            aria-invalid={Boolean(formErrors.descripcion)}
          />
          {formErrors.descripcion && (
            <span className="inventory-form-error">
              {formErrors.descripcion}
            </span>
          )}
        </label>

        <label className="inventory-form-field">
          RUT del usuario que registra
          <input
            name="rut_usuario"
            value={form.rut_usuario}
            onChange={updateFormField}
            required
            aria-invalid={Boolean(formErrors.rut_usuario)}
            aria-describedby="inventory-rut-help"
          />
          <span id="inventory-rut-help">
            Más adelante se asociará automáticamente a la sesión iniciada.
          </span>
          {formErrors.rut_usuario && (
            <span className="inventory-form-error">
              {formErrors.rut_usuario}
            </span>
          )}
        </label>

        <div className="inventory-form-actions">
          <button
            className="inventory-form-cancel"
            type="button"
            onClick={closeForm}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            className="inventory-form-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : 'Registrar insumo'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
