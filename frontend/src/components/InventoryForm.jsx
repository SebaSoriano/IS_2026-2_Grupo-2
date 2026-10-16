import { useEffect, useRef, useState } from 'react'
import { actualizarInsumo, crearInsumo } from '../services/api.js'
import './InventoryForm.css'

const TIPOS_INSUMO = [
  'Alimentación',
  'Higiene y aseo',
  'Salud',
  'Limpieza',
  'Accesorios y juguetes',
  'Otros',
]

const EMPTY_FORM = {
  tipo_insumo: '',
  fecha_ingreso: '',
  fecha_vencimiento: '',
  descripcion: '',
  cantidad: '',
  rut_usuario: '',
}

function getTodayDateString() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function formFromInsumo(insumo) {
  const dateForInput = (value) =>
    value ? new Date(value).toISOString().slice(0, 10) : ''

  return {
    tipo_insumo: insumo.tipo_insumo ?? '',
    fecha_ingreso: dateForInput(insumo.fecha_ingreso),
    fecha_vencimiento: dateForInput(insumo.fecha_vencimiento),
    descripcion: insumo.descripcion ?? '',
    cantidad: String(insumo.cantidad ?? ''),
    rut_usuario: insumo.usuario?.rut_usuario ?? insumo.rut_usuario ?? '',
  }
}

export default function InventoryForm({
  isOpen,
  insumo = null,
  onClose,
  onCreated,
  onUpdated,
}) {
  const isEditing = insumo != null
  const originalExpirationDate = isEditing
    ? formFromInsumo(insumo).fecha_vencimiento
    : ''
  const [form, setForm] = useState(() =>
    isEditing ? formFromInsumo(insumo) : EMPTY_FORM,
  )
  const todayDateString = getTodayDateString()
  const unchangedPastExpiration =
    isEditing &&
    form.fecha_vencimiento === originalExpirationDate &&
    originalExpirationDate < todayDateString
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

    if (unchangedPastExpiration) {
      delete payload.fecha_vencimiento
    }

    try {
      const insumoGuardado = isEditing
        ? await actualizarInsumo(insumo.id, payload)
        : await crearInsumo(payload)
      if (isEditing) {
        onUpdated(insumoGuardado)
      } else {
        onCreated(insumoGuardado)
      }
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
          <h2 id="inventory-dialog-title">
            {isEditing ? `Modificar insumo ${insumo.id}` : 'Registrar insumo'}
          </h2>
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
          <select
            name="tipo_insumo"
            value={form.tipo_insumo}
            onChange={updateFormField}
            required
            aria-invalid={Boolean(formErrors.tipo_insumo)}
          >
            <option value="" disabled>Selecciona un tipo</option>
            {TIPOS_INSUMO.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
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
            max="99"
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
            min={unchangedPastExpiration ? undefined : todayDateString}
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
            {isSubmitting
              ? isEditing
                ? 'Guardando...'
                : 'Registrando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Registrar insumo'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
