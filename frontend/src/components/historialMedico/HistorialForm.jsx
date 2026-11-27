import { useEffect, useRef, useState } from 'react'
import { actualizarHistorial, crearHistorial, crearProcedimiento } from '../../services/api.js'
import { hoyIso } from '../../utils/fechas.js'
import Autocompletar from '../Autocompletar.jsx'
import CampoFecha from '../fecha/CampoFecha.jsx'
import HistorialInsumos from './HistorialInsumos.jsx'
import { useProcedimientos } from './useProcedimientos.js'
import { useSugerenciasHistorial } from './useSugerenciasHistorial.js'
// se reutilizan los estilos del popup de animales para que todos los formularios se vean iguales
import '../animales/AnimalForm.css'
// tamaño y orden de los campos propios de esta ventana (más ancha que la de animales)
import './HistorialForm.css'

// Mínimo de letras para poder agregar un procedimiento nuevo al catálogo
// (el backend pide lo mismo en procedimientos.schema.js)
const MINIMO_PROCEDIMIENTO = 3

// Deja un nombre listo para comparar: sin espacios en los bordes, en minúsculas y sin tildes.
// Así "vacuna antirrabica" se reconoce como el mismo procedimiento que "Vacuna Antirrábica".
// (Es la misma idea que normalizar en Autocompletar.jsx)
const normalizarNombre = (texto) =>
  texto.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// valores iniciales del formulario
const formularioVacio = {
  id_animal: '',
  // texto escrito en el campo Animal; id_animal se llena recién al elegir un animal de la lista
  nombre_animal: '',
  tratamiento: '',
  fecha_tratamiento: '',
  veterinario: '',
  observaciones: '',
  // insumos usados: lista de { id_insumo, cantidad } que arma HistorialInsumos
  insumos: [],
}

// los inputs trabajan con texto: el id se pasa a String y de la fecha
// "2025-03-06T00:00:00.000Z" se toman los 10 primeros caracteres ("2025-03-06"),
function formularioDesdeRegistro(registro) {
  return {
    id_animal: String(registro.id_animal),
    nombre_animal: registro.animal.nombre_animal,
    tratamiento: registro.tratamiento,
    fecha_tratamiento: registro.fecha_tratamiento.slice(0, 10),
    veterinario: registro.veterinario,
    observaciones: registro.observaciones ?? '',
    // los insumos que el registro ya tenía, con la cantidad como texto (como en los inputs).
    // Los de tipo "estado" no tienen cantidad: se dejan en null (String(null) daría el texto "null")
    insumos: registro.insumos.map((insumo) => ({
      id_insumo: insumo.id_insumo,
      cantidad: insumo.cantidad == null ? null : String(insumo.cantidad),
    })),
  }
}

// popup para registrar o modificar un registro médico.
// Si recibe un registro, se está modificando; si recibe null, se está creando uno nuevo.
export default function HistorialForm({ registro, onClose, onSaved }) {
  const esEdicion = registro != null

  const [formulario, setFormulario] = useState(
    esEdicion ? formularioDesdeRegistro(registro) : formularioVacio,
  )
  // Listas para la búsqueda con predicción de los campos Animal y Veterinario
  const { opcionesAnimales, opcionesVeterinarios } = useSugerenciasHistorial()
  // Catálogo de procedimientos para el campo "Tipo de tratamiento"
  const { procedimientos, estado: estadoProcedimientos, recargar: recargarProcedimientos } = useProcedimientos()
  // true mientras se guarda un procedimiento nuevo (el botón dice "Agregando...")
  const [agregandoProcedimiento, setAgregandoProcedimiento] = useState(false)
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

  function cambiarCampo(event) {
    setFormulario({ ...formulario, [event.target.name]: event.target.value })
  }

  // Cambia varios campos a la vez sin tocar los demás (lo usan los Autocompletar)
  function cambiarValores(cambios) {
    setFormulario({ ...formulario, ...cambios })
  }

  // El registro se asocia a un animal por su id, no por su nombre (puede haber dos "Toby").
  // Por eso, si se escribió algo pero no se eligió un animal de la lista, se muestra un error
  // y el formulario no se puede enviar.
  const errorAnimal =
    formulario.nombre_animal.trim() !== '' && formulario.id_animal === ''
      ? 'Elige un animal de la lista'
      : ''

  // Opciones para el Autocompletar: el nombre sirve como valor y como texto
  const opcionesProcedimientos = procedimientos.map((procedimiento) => ({
    valor: procedimiento.id_procedimiento,
    texto: procedimiento.nombre,
  }))

  // ¿Lo escrito ya es un procedimiento del catálogo? (sin importar mayúsculas ni tildes)
  const textoTratamiento = normalizarNombre(formulario.tratamiento)
  const procedimientoExiste = procedimientos.some(
    (procedimiento) => normalizarNombre(procedimiento.nombre) === textoTratamiento,
  )

  // El tipo de tratamiento se elige de la lista, igual que el animal.
  // Si se escribió algo que no está en el catálogo, se muestra un error y no se puede guardar
  // hasta elegir uno de la lista o agregarlo con el botón "Agregar tratamiento".
  const tratamientoOriginal = esEdicion && formulario.tratamiento === registro.tratamiento
  const errorTratamiento =
    textoTratamiento !== '' &&
    estadoProcedimientos === 'listo' &&
    !procedimientoExiste &&
    !tratamientoOriginal
      ? 'Elige un tratamiento de la lista o agrégalo con el botón'
      : ''

  // El botón "Agregar tratamiento" se enciende cuando hay al menos 3 letras escritas
  // y ese nombre todavía no está en el catálogo (si ya está, basta con elegirlo de la lista)
  const puedeAgregarProcedimiento =
    formulario.tratamiento.trim().length >= MINIMO_PROCEDIMIENTO &&
    estadoProcedimientos === 'listo' &&
    !procedimientoExiste &&
    !agregandoProcedimiento

  // Agrega lo escrito al catálogo de procedimientos (POST /api/procedimientos).
  // Antes de guardar se muestra un aviso con el nombre tal como quedará,
  // para que la persona revise si lo escribió bien. Si aprieta "Cancelar", no se guarda nada.
  async function agregarProcedimiento() {
    const nombre = formulario.tratamiento.trim()
    const confirmado = window.confirm(`Se creará el procedimiento llamado: ${nombre}`)
    if (!confirmado) return

    setMensajeError('')
    setAgregandoProcedimiento(true)
    try {
      const creado = await crearProcedimiento(nombre)
      // se vuelve a pedir la lista para que el nuevo aparezca en las sugerencias,
      // y se deja escrito en el campo con el nombre exacto que guardó el backend
      await recargarProcedimientos()
      cambiarValores({ tratamiento: creado.nombre })
    } catch (error) {
      // por ejemplo 409 "Ya existe el procedimiento ..." si otra persona lo agregó recién
      setMensajeError(error.details ? error.message : 'No se pudo conectar con el servidor')
    } finally {
      setAgregandoProcedimiento(false)
    }
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

    // Se arma lo que espera el backend: id_animal y las cantidades como número (no como texto)
    // y observaciones vacías como null, para que se guarden como "sin observaciones".
    // Los insumos se mandan siempre como la lista COMPLETA: al crear se descuentan todos,
    // y al modificar el backend compara con la lista anterior y solo ajusta la diferencia
    // (si no se tocaron, todas las diferencias dan 0 y el inventario no cambia).
    const datos = {
      id_animal: Number(formulario.id_animal),
      tratamiento: formulario.tratamiento,
      fecha_tratamiento: formulario.fecha_tratamiento,
      veterinario: formulario.veterinario,
      observaciones: formulario.observaciones.trim() || null,
      // los insumos de estado van con cantidad null (Number(null) daría 0, que el backend rechaza)
      insumos: formulario.insumos.map((insumo) => ({
        id_insumo: insumo.id_insumo,
        cantidad: insumo.cantidad == null ? null : Number(insumo.cantidad),
      })),
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
        // El backend respondió con otro error, por ejemplo 400 "El animal indicado no existe",
        // 404, o 409 "No hay stock suficiente de ..." si otra persona usó el insumo mientras tanto
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
      className="animal-dialog historial-dialog"
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

        {/* Animal, fecha y veterinario en una misma fila (ver HistorialForm.css) */}
        <div className="historial-form__fila-datos">
          <label className="animal-form__field">
            Animal
            {/* Al escribir se borra el id elegido antes; al elegir de la lista se guardan
                el id (lo que se manda al backend) y el nombre (lo que se ve en el campo) */}
            <Autocompletar
              name="nombre_animal"
              opciones={opcionesAnimales}
              texto={formulario.nombre_animal}
              onCambiarTexto={(texto) => cambiarValores({ nombre_animal: texto, id_animal: '' })}
              onElegir={(opcion) =>
                cambiarValores({ nombre_animal: opcion.texto, id_animal: String(opcion.valor) })
              }
              placeholder="Escribe el nombre del animal"
              error={errorAnimal}
              required
            />
            {errores.id_animal && <span className="animal-form__error">{errores.id_animal}</span>}
          </label>

          <label className="animal-form__field">
            Fecha
            {/* Se escribe como DD-MM-AAAA, pero se guarda en formulario como AAAA-MM-DD.
                max={hoyIso()} no deja elegir días futuros */}
            <CampoFecha
              name="fecha_tratamiento"
              value={formulario.fecha_tratamiento}
              onChange={cambiarCampo}
              max={hoyIso()}
              required
            />
            {errores.fecha_tratamiento && (
              <span className="animal-form__error">{errores.fecha_tratamiento}</span>
            )}
          </label>

          <label className="animal-form__field">
            Veterinario
            {/* Sugiere los veterinarios ya registrados, pero se puede escribir uno nuevo */}
            <Autocompletar
              name="veterinario"
              opciones={opcionesVeterinarios}
              texto={formulario.veterinario}
              onCambiarTexto={(texto) => cambiarValores({ veterinario: texto })}
              onElegir={(opcion) => cambiarValores({ veterinario: opcion.texto })}
              placeholder="Ej: Dra. Sofía González"
              maxLength={100}
              required
            />
            {errores.veterinario && (
              <span className="animal-form__error">{errores.veterinario}</span>
            )}
          </label>
        </div>

        {/* historial-form__tratamiento deja espacio abajo para el mensaje de error del campo */}
        <label className="animal-form__field historial-form__tratamiento">
          Tipo de tratamiento
          {/* Sugiere los procedimientos del catálogo mientras se escribe.
              "extra" pone el botón "Agregar tratamiento" a la derecha del campo, en la misma fila
              (ver autocompletar__fila en Autocompletar.css). Es type="button" para que al
              apretarlo no se envíe el formulario completo. */}
          <Autocompletar
            name="tratamiento"
            opciones={opcionesProcedimientos}
            texto={formulario.tratamiento}
            onCambiarTexto={(texto) => cambiarValores({ tratamiento: texto })}
            onElegir={(opcion) => cambiarValores({ tratamiento: opcion.texto })}
            placeholder="Ej: Vacuna Antirrábica"
            maxLength={100}
            error={errorTratamiento}
            required
            extra={
              <button
                className="historial-form__agregar-procedimiento"
                type="button"
                onClick={agregarProcedimiento}
                disabled={!puedeAgregarProcedimiento}
                title={
                  procedimientoExiste
                    ? 'Este tratamiento ya está en la lista'
                    : `Escribe al menos ${MINIMO_PROCEDIMIENTO} letras para agregarlo a la lista`
                }
              >
                {agregandoProcedimiento ? 'Agregando...' : 'Agregar tratamiento'}
              </button>
            }
          />
          {errores.tratamiento && (
            <span className="animal-form__error">{errores.tratamiento}</span>
          )}
        </label>

        {/* fieldset agrupa los campos del selector de insumos bajo un mismo título (legend).
            Se usa en vez de label porque adentro hay varios campos, no uno solo */}
        <fieldset className="historial-form__insumos">
          <legend>Insumos utilizados</legend>
          <HistorialInsumos
            elegidos={formulario.insumos}
            onChange={(insumos) => cambiarValores({ insumos })}
            usadosAntes={esEdicion ? registro.insumos : []}
          />
          {esEdicion && (
            <p className="historial-insumos__ayuda">
              Al guardar, el inventario se ajusta: si usas más se descuenta la diferencia y si usas menos
              o quitas un insumo, se devuelve.
            </p>
          )}
          {errores.insumos && <span className="animal-form__error">{errores.insumos}</span>}
        </fieldset>

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