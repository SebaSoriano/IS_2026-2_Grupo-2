import { useEffect, useRef, useState } from 'react'
import { getUsuarios, registrarAdopcion } from '../services/api.js'
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
  fecha_adopcion: '',
  rut_usuario: '',
  nombre_adoptante: '',
  direccion: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: '',
  observaciones_adoptante: '',
}

export default function AdoptionForm({ animal, onClose, onSaved }) {
  // La fecha de adopción parte con el día de hoy
  const [formulario, setFormulario] = useState(() => ({
    ...formularioVacio,
    fecha_adopcion: fechaDeHoy(),
  }))
  // Lista de voluntarios para elegir quién registra la adopción
  const [voluntarios, setVoluntarios] = useState([])
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

  // Cargar los voluntarios para el <select>
  useEffect(() => {
    getUsuarios()
      .then((lista) => setVoluntarios(lista))
      .catch(() => setMensajeError('No se pudo cargar la lista de voluntarios'))
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
      fecha_adopcion: formulario.fecha_adopcion,
      rut_usuario: formulario.rut_usuario,
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
      await registrarAdopcion(animal.id_animal, datos)
      // Avisarle a AdoptionSection que se registró (ella cierra el popup y actualiza las tablas)
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
        // Otro error del backend, ej: 409 "El animal ya fue adoptado"
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
          <h2 id="adoption-dialog-title">Registrar adopción</h2>
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

        <p className="adoption-form__animal">
          Animal: <strong>{animal.nombre_animal}</strong> ({animal.especie_animal}, id{' '}
          {animal.id_animal})
        </p>

        {mensajeError && (
          <p className="adoption-form__error" role="alert">
            {mensajeError}
          </p>
        )}

        <fieldset className="adoption-form__group">
          <legend>Datos de la adopción</legend>

          <div className="adoption-form__row">
            <label className="adoption-form__field">
              Fecha de adopción
              <input
                name="fecha_adopcion"
                type="date"
                value={formulario.fecha_adopcion}
                onChange={cambiarCampo}
                max={fechaDeHoy()}
                required
              />
              {errores.fecha_adopcion && (
                <span className="adoption-form__error">{errores.fecha_adopcion}</span>
              )}
            </label>

            <label className="adoption-form__field">
              Voluntario que registra
              <select
                name="rut_usuario"
                value={formulario.rut_usuario}
                onChange={cambiarCampo}
                required
              >
                <option value="">Selecciona un voluntario</option>
                {voluntarios.map((voluntario) => (
                  <option value={voluntario.rut_usuario} key={voluntario.rut_usuario}>
                    {voluntario.nombre_usuario} ({voluntario.rut_usuario})
                  </option>
                ))}
              </select>
              {errores.rut_usuario && (
                <span className="adoption-form__error">{errores.rut_usuario}</span>
              )}
            </label>
          </div>
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
            {enviando ? 'Registrando...' : 'Registrar adopción'}
          </button>
        </div>
      </form>
    </dialog>
  )
}