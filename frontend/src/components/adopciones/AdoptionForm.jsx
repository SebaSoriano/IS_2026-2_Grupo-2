import { useEffect, useRef, useState } from 'react'
import { getAnimales, registrarSolicitudManual } from '../../services/api.js'
import './AdoptionForm.css'

// Fecha de hoy en formato AAAA-MM-DD usando la hora de Chile (no la hora UTC)
function fechaDeHoy() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

// Campos del formulario (los mismos nombres que pide el backend)
const formularioVacio = {
  id_animal: '',
  nombre_adoptante: '',
  direccion: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: '',
  observaciones_adoptante: '',
}

// Popup para ingresar a mano un adoptante (ej: alguien que llegó al refugio)
// y asignarle uno de los animales disponibles. La solicitud queda "en proceso".
export default function AdoptionForm({ onClose, onSaved }) {
  const [formulario, setFormulario] = useState(formularioVacio)
  // Animales disponibles para el <select>
  const [animales, setAnimales] = useState([])
  const [errores, setErrores] = useState({})
  const [mensajeError, setMensajeError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const dialogRef = useRef(null)

  // Abrir el popup apenas aparece el componente
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  // Cargar solo los animales disponibles (el mismo filtro que usa la sección Animales)
  useEffect(() => {
    getAnimales({ estado: 'disponible' })
      .then((lista) => setAnimales(lista))
      .catch(() => setMensajeError('No se pudo cargar la lista de animales disponibles'))
  }, [])

  function cambiarCampo(event) {
    const nombreCampo = event.target.name
    const valorNuevo = event.target.value
    setFormulario({ ...formulario, [nombreCampo]: valorNuevo })
  }

  function cerrar() {
    if (enviando) return
    onClose()
  }

  async function enviarFormulario(event) {
    event.preventDefault()
    setErrores({})
    setMensajeError('')
    setEnviando(true)

    const datos = {
      // el <select> entrega texto ("5"); el backend espera un número
      id_animal: Number(formulario.id_animal),
      nombre_adoptante: formulario.nombre_adoptante,
      direccion: formulario.direccion,
      telefono: formulario.telefono.trim(),
      correo: formulario.correo.trim(),
      fecha_nacimiento: formulario.fecha_nacimiento,
    }
    // Las observaciones son opcionales: solo se envían si se escribió algo
    if (formulario.observaciones_adoptante.trim() !== '') {
      datos.observaciones_adoptante = formulario.observaciones_adoptante
    }

    try {
      await registrarSolicitudManual(datos)
      // Avisarle a AdoptionSection (ella cierra el popup y recarga la tabla)
      onSaved()
    } catch (error) {
      if (error.details && error.details.length > 0) {
        // 400: errores de validación, uno por campo
        const erroresPorCampo = {}
        for (const detalle of error.details) {
          erroresPorCampo[detalle.campo] = detalle.mensaje
        }
        setErrores(erroresPorCampo)
        setMensajeError('Revisa los campos marcados')
      } else if (error.details) {
        // Otro error del backend, ej: 409 "El animal no está disponible para adopción"
        setMensajeError(error.message)
      } else {
        setMensajeError('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <dialog
      className="adoption-dialog"
      ref={dialogRef}
      aria-labelledby="adoption-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        cerrar()
      }}
    >
      <form className="adoption-form" onSubmit={enviarFormulario}>
        <div className="adoption-dialog-header">
          <h2 id="adoption-dialog-title">Ingresar adoptante</h2>
          <button
            className="adoption-dialog-close"
            type="button"
            aria-label="Cerrar"
            onClick={cerrar}
            disabled={enviando}
          >
            ×
          </button>
        </div>

        {mensajeError && (
          <p className="adoption-form__error" role="alert">
            {mensajeError}
          </p>
        )}

        <fieldset className="adoption-form__group">
          <legend>Animal asignado</legend>

          <label className="adoption-form__field">
            Animal disponible
            <select
              name="id_animal"
              value={formulario.id_animal}
              onChange={cambiarCampo}
              required
            >
              <option value="">Selecciona un animal</option>
              {animales.map((animal) => (
                <option value={animal.id_animal} key={animal.id_animal}>
                  {animal.nombre_animal} ({animal.especie_animal}, id {animal.id_animal})
                </option>
              ))}
            </select>
            {errores.id_animal && (
              <span className="adoption-form__error">{errores.id_animal}</span>
            )}
          </label>
        </fieldset>

        <fieldset className="adoption-form__group">
          <legend>Datos del adoptante</legend>

          <label className="adoption-form__field">
            Nombre completo
            <input
              name="nombre_adoptante"
              type="text"
              value={formulario.nombre_adoptante}
              onChange={cambiarCampo}
              minLength={2}
              maxLength={100}
              required
            />
            {errores.nombre_adoptante && (
              <span className="adoption-form__error">{errores.nombre_adoptante}</span>
            )}
          </label>

          <label className="adoption-form__field">
            Dirección
            <input
              name="direccion"
              type="text"
              value={formulario.direccion}
              onChange={cambiarCampo}
              minLength={5}
              maxLength={200}
              required
            />
            {errores.direccion && (
              <span className="adoption-form__error">{errores.direccion}</span>
            )}
          </label>

          <div className="adoption-form__row">
            <label className="adoption-form__field">
              Teléfono
              <input
                name="telefono"
                type="tel"
                value={formulario.telefono}
                onChange={cambiarCampo}
                placeholder="+56912345678"
                required
              />
              {errores.telefono && (
                <span className="adoption-form__error">{errores.telefono}</span>
              )}
            </label>

            <label className="adoption-form__field">
              Correo
              <input
                name="correo"
                type="email"
                value={formulario.correo}
                onChange={cambiarCampo}
                required
              />
              {errores.correo && <span className="adoption-form__error">{errores.correo}</span>}
            </label>
          </div>

          <label className="adoption-form__field">
            Fecha de nacimiento
            <input
              name="fecha_nacimiento"
              type="date"
              value={formulario.fecha_nacimiento}
              onChange={cambiarCampo}
              max={fechaDeHoy()}
              required
            />
            {errores.fecha_nacimiento && (
              <span className="adoption-form__error">{errores.fecha_nacimiento}</span>
            )}
          </label>

          <label className="adoption-form__field">
            Observaciones (opcional)
            <textarea
              name="observaciones_adoptante"
              value={formulario.observaciones_adoptante}
              onChange={cambiarCampo}
              rows={3}
              maxLength={500}
            />
            {errores.observaciones_adoptante && (
              <span className="adoption-form__error">{errores.observaciones_adoptante}</span>
            )}
          </label>
        </fieldset>

        <div className="adoption-form__actions">
          <button
            className="adoption-form__cancel"
            type="button"
            onClick={cerrar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button className="adoption-form__submit" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : formulario.id_animal ? 'Ingresar y asignar' : 'Ingresar adoptante'}
          </button>
        </div>
      </form>
    </dialog>
  )
}