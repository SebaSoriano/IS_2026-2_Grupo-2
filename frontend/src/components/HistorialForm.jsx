import { useEffect, useRef, useState } from 'react'
import { actualizarHistorial, crearHistorial, getAnimales } from '../services/api.js'
// se reutilizan los estilos del popup de animales para que todos los formularios se vean iguales
import './AnimalForm.css'

// Valores iniciales del formulario
const formularioVacio = {
  id_animal: '',
  tratamiento: '',
  fecha_tratamiento: '',
  veterinario: '',
  observaciones: '',
}

// los inputs trabajan con texto: el id se pasa a String y de la fecha
// "2025-03-06T00:00:00.000Z" se toman los 10 primeros caracteres ("2025-03-06"),
function formularioDesdeRegistro(registro) {
  return {
    id_animal: String(registro.id_animal),
    tratamiento: registro.tratamiento,
    fecha_tratamiento: registro.fecha_tratamiento.slice(0, 10),
    veterinario: registro.veterinario,
    observaciones: registro.observaciones ?? '',
  }
}

// fecha de hoy en formato AAAA-MM-DD, para que el calendario no deje elegir días futuros.
// el formato 'en-CA' (Canadá) escribe las fechas justo como AAAA-MM-DD.
const hoy = () => new Date().toLocaleDateString('en-CA')

// popup para registrar o modificar un registro médico.
// Si recibe un registro, se está modificando; si recibe null, se está creando uno nuevo.
export default function HistorialForm({ registro, onClose, onSaved }) {
  const esEdicion = registro != null

  const [formulario, setFormulario] = useState(
    esEdicion ? formularioDesdeRegistro(registro) : formularioVacio,
  )
  // Animales para la lista desplegable (el registro se asocia a un animal por su id)
  const [animales, setAnimales] = useState([])
  const [errores, setErrores] = useState({})
  const [mensajeError, setMensajeError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Referencia al <dialog> para poder abrirlo como popup
  const dialogRef = useRef(null)

  // Se abre el popup apenas aparece el componente
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  // Se cargan los animales una vez, para llenar la lista desplegable
  useEffect(() => {
    getAnimales()
      .then(setAnimales)
      .catch(() => setMensajeError('No se pudieron cargar los animales'))
  }, [])

  function cambiarCampo(event) {
    setFormulario({ ...formulario, [event.target.name]: event.target.value })
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

    // Se arma lo que espera el backend: id_animal como número (no como texto)
    // y observaciones vacías como null, para que se guarden como "sin observaciones"
    const datos = {
      id_animal: Number(formulario.id_animal),
      tratamiento: formulario.tratamiento,
      fecha_tratamiento: formulario.fecha_tratamiento,
      veterinario: formulario.veterinario,
      observaciones: formulario.observaciones.trim() || null,
    }

    try {
      const registroGuardado = esEdicion
        ? await actualizarHistorial(registro.id_historial, datos)
        : await crearHistorial(datos)
      // Se avisa a HistorialSection que se guardó (cierra el popup y recarga la tabla)
      onSaved(registroGuardado)
    } catch (error) {
      if (error.details && error.details.length > 0) {
        // 400: errores de validación, uno por campo. Se guardan en un objeto
        // { campo: mensaje } para mostrar cada mensaje debajo de su input.
        const erroresPorCampo = {}
        for (const detalle of error.details) {
          erroresPorCampo[detalle.campo] = detalle.mensaje
        }
        setErrores(erroresPorCampo)
        setMensajeError('Revisa los campos marcados')
      } else if (error.details) {
        // El backend respondió con otro error (por ejemplo 400 "El animal indicado no existe" o 404)
        setMensajeError(error.message)
      } else {
        // No hubo respuesta del backend
        setMensajeError('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <dialog
      className="animal-dialog"
      ref={dialogRef}
      aria-labelledby="historial-dialog-title"
      onCancel={(event) => {
        // Se cierra el popup al apretar ESC, pero solo si no se está guardando
        event.preventDefault()
        cerrar()
      }}
    >
      <form className="animal-form" onSubmit={enviarFormulario}>
        <div className="animal-dialog-header">
          <h2 id="historial-dialog-title">
            {esEdicion ? 'Modificar registro médico' : 'Añadir registro médico'}
          </h2>
          <button
            className="animal-dialog-close"
            type="button"
            aria-label="Cerrar"
            onClick={cerrar}
            disabled={enviando}
          >
            ×
          </button>
        </div>

        {mensajeError && (
          <p className="animal-form__error" role="alert">
            {mensajeError}
          </p>
        )}

        <label className="animal-form__field">
          Animal
          <select name="id_animal" value={formulario.id_animal} onChange={cambiarCampo} required>
            <option value="">Selecciona un animal</option>
            {animales.map((animal) => (
              <option value={animal.id_animal} key={animal.id_animal}>
                {animal.nombre_animal} ({animal.especie_animal}, id {animal.id_animal})
              </option>
            ))}
          </select>
          {errores.id_animal && <span className="animal-form__error">{errores.id_animal}</span>}
        </label>

        <label className="animal-form__field">
          Tipo de tratamiento
          <input
            name="tratamiento"
            type="text"
            value={formulario.tratamiento}
            onChange={cambiarCampo}
            placeholder="Ej: Vacuna antirrábica"
            minLength={2}
            maxLength={500}
            required
          />
          {errores.tratamiento && (
            <span className="animal-form__error">{errores.tratamiento}</span>
          )}
        </label>

        <div className="animal-form__row">
          <label className="animal-form__field">
            Fecha
            <input
              name="fecha_tratamiento"
              type="date"
              value={formulario.fecha_tratamiento}
              onChange={cambiarCampo}
              max={hoy()}
              required
            />
            {errores.fecha_tratamiento && (
              <span className="animal-form__error">{errores.fecha_tratamiento}</span>
            )}
          </label>

          <label className="animal-form__field">
            Veterinario
            <input
              name="veterinario"
              type="text"
              value={formulario.veterinario}
              onChange={cambiarCampo}
              placeholder="Ej: Dra. Sofía González"
              minLength={2}
              maxLength={100}
              required
            />
            {errores.veterinario && (
              <span className="animal-form__error">{errores.veterinario}</span>
            )}
          </label>
        </div>

        {/* Espacio reservado para los insumos: se habilita cuando la base de datos
            registre qué insumos se usaron en cada tratamiento */}
        <label className="animal-form__field">
          Insumos utilizados
          <input type="text" placeholder="Pendiente: aún no se registran en la base de datos" disabled />
        </label>

        <label className="animal-form__field">
          Observaciones
          <textarea
            name="observaciones"
            value={formulario.observaciones}
            onChange={cambiarCampo}
            rows={4}
            maxLength={500}
            placeholder="Ej: sin reacciones adversas"
          />
          {errores.observaciones && (
            <span className="animal-form__error">{errores.observaciones}</span>
          )}
        </label>

        <div className="animal-form__actions">
          <button className="animal-form__cancel" type="button" onClick={cerrar} disabled={enviando}>
            Cancelar
          </button>
          <button className="animal-form__submit" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Añadir registro'}
          </button>
        </div>
      </form>
    </dialog>
  )
}