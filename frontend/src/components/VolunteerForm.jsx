import { useEffect, useRef, useState } from 'react'
import { actualizarUsuario, crearUsuario } from '../services/api.js'
import { roles } from '../data/roles.js'
import './VolunteerForm.css'

// Valores iniciales al crear
const formularioVacio = {
  rut_usuario: '',
  nombre_usuario: '',
  correo: '',
  telefono: '',
  fecha_nacimiento: '',
  rol_id: '3', // por defecto "Voluntario"
  contrasena: '',
}

// Convierte un usuario de la base de datos en los valores del formulario
function formularioDesdeUsuario(usuario) {
  return {
    rut_usuario: usuario.rut_usuario,
    nombre_usuario: usuario.nombre_usuario,
    correo: usuario.correo ?? '',
    telefono: usuario.telefono ?? '',
    // La base devuelve "1995-04-10T00:00:00.000Z"; el input de fecha necesita "1995-04-10"
    fecha_nacimiento: usuario.fecha_nacimiento ? usuario.fecha_nacimiento.slice(0, 10) : '',
    rol_id: String(usuario.rol_id),
    contrasena: '', // nunca se muestra la contraseña actual
  }
}

// Arma el objeto que se envía al backend: solo los campos que tienen algo escrito
function armarDatos(formulario, esEdicion) {
  const datos = {
    nombre_usuario: formulario.nombre_usuario.trim(),
    rol_id: Number(formulario.rol_id),
  }

  // El RUT solo se envía al crear (al modificar va en la URL y no se puede cambiar)
  if (!esEdicion) {
    datos.rut_usuario = formulario.rut_usuario.trim().toUpperCase()
  }
  if (formulario.correo.trim() !== '') {
    datos.correo = formulario.correo.trim()
  }
  if (formulario.telefono.trim() !== '') {
    datos.telefono = formulario.telefono.trim()
  }
  if (formulario.fecha_nacimiento !== '') {
    // Fecha completa en formato ISO, que acepta tanto el registro como la modificación
    datos.fecha_nacimiento = new Date(formulario.fecha_nacimiento).toISOString()
  }
  // Al modificar, la contraseña solo se envía si se escribió una nueva
  if (formulario.contrasena !== '') {
    datos.contrasena = formulario.contrasena
  }

  return datos
}

export default function VolunteerForm({ usuario, onClose, onSaved }) {
  // Si recibe un usuario, está modificando; si no, está creando
  const esEdicion = usuario != null

  const [formulario, setFormulario] = useState(
    esEdicion ? formularioDesdeUsuario(usuario) : formularioVacio,
  )
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

    const datos = armarDatos(formulario, esEdicion)

    try {
      let usuarioGuardado
      if (esEdicion) {
        usuarioGuardado = await actualizarUsuario(usuario.rut_usuario, datos)
      } else {
        usuarioGuardado = await crearUsuario(datos)
      }
      onSaved(usuarioGuardado)
    } catch (error) {
      if (error.details && error.details.length > 0) {
        const erroresPorCampo = {}
        for (const detalle of error.details) {
          erroresPorCampo[detalle.campo] = detalle.mensaje
        }
        setErrores(erroresPorCampo)
        setMensajeError('Revisa los campos marcados')
      } else if (error.details) {
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
      className="volunteer-dialog"
      ref={dialogRef}
      aria-labelledby="volunteer-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        cerrar()
      }}
    >
      <form className="volunteer-form" onSubmit={enviarFormulario}>
        <div className="volunteer-dialog-header">
          <h2 id="volunteer-dialog-title">
            {esEdicion ? `Modificar voluntario ${usuario.rut_usuario}` : 'Registrar voluntario'}
          </h2>
          <button
            className="volunteer-dialog-close"
            type="button"
            aria-label="Cerrar"
            onClick={cerrar}
            disabled={enviando}
          >
            ×
          </button>
        </div>

        {mensajeError && (
          <p className="volunteer-form__error" role="alert">
            {mensajeError}
          </p>
        )}

        <div className="volunteer-form__row">
          <label className="volunteer-form__field">
            RUT
            <input
              name="rut_usuario"
              type="text"
              value={formulario.rut_usuario}
              onChange={cambiarCampo}
              placeholder="12345678-9"
              pattern="\d{7,8}-[\dkK]"
              title="Formato 12345678-9"
              disabled={esEdicion}
              required
            />
            {errores.rut_usuario && (
              <span className="volunteer-form__error">{errores.rut_usuario}</span>
            )}
          </label>

          <label className="volunteer-form__field">
            Rol
            <select name="rol_id" value={formulario.rol_id} onChange={cambiarCampo} required>
              {roles.map((rol) => (
                <option value={rol.id} key={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
            {errores.rol_id && <span className="volunteer-form__error">{errores.rol_id}</span>}
          </label>
        </div>

        <label className="volunteer-form__field">
          Nombre completo
          <input
            name="nombre_usuario"
            type="text"
            value={formulario.nombre_usuario}
            onChange={cambiarCampo}
            minLength={2}
            maxLength={100}
            required
          />
          {errores.nombre_usuario && (
            <span className="volunteer-form__error">{errores.nombre_usuario}</span>
          )}
        </label>

        <div className="volunteer-form__row">
          <label className="volunteer-form__field">
            Correo (opcional)
            <input
              name="correo"
              type="email"
              value={formulario.correo}
              onChange={cambiarCampo}
              maxLength={100}
            />
            {errores.correo && <span className="volunteer-form__error">{errores.correo}</span>}
          </label>

          <label className="volunteer-form__field">
            Teléfono (opcional)
            <input
              name="telefono"
              type="tel"
              value={formulario.telefono}
              onChange={cambiarCampo}
              placeholder="+56912345678"
            />
            {errores.telefono && (
              <span className="volunteer-form__error">{errores.telefono}</span>
            )}
          </label>
        </div>

        <div className="volunteer-form__row">
          <label className="volunteer-form__field">
            Fecha de nacimiento (opcional)
            <input
              name="fecha_nacimiento"
              type="date"
              value={formulario.fecha_nacimiento}
              onChange={cambiarCampo}
            />
            {errores.fecha_nacimiento && (
              <span className="volunteer-form__error">{errores.fecha_nacimiento}</span>
            )}
          </label>

          <label className="volunteer-form__field">
            {esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            <input
              name="contrasena"
              type="password"
              value={formulario.contrasena}
              onChange={cambiarCampo}
              minLength={6}
              maxLength={100}
              required={!esEdicion}
              autoComplete="new-password"
            />
            {esEdicion && (
              <span className="volunteer-form__help">Déjala vacía para no cambiarla.</span>
            )}
            {errores.contrasena && (
              <span className="volunteer-form__error">{errores.contrasena}</span>
            )}
          </label>
        </div>

        <div className="volunteer-form__actions">
          <button
            className="volunteer-form__cancel"
            type="button"
            onClick={cerrar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button className="volunteer-form__submit" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar voluntario'}
          </button>
        </div>
      </form>
    </dialog>
  )
}