import { useEffect, useState } from 'react'
import { eliminarHistorial, getAnimales, getHistoriales } from '../services/api.js'
import HistorialFiltros from './HistorialFiltros.jsx'
import HistorialForm from './HistorialForm.jsx'
import HistorialTabla from './HistorialTabla.jsx'
import HistorialTarjetas from './HistorialTarjetas.jsx'
import './HistorialSection.css'

// Cantidad de registros por página. El backend acepta entre 1 y 100.
const REGISTROS_POR_PAGINA = 15

// Pestaña "Historial Médico". Este componente es el que guarda el estado y habla con el backend;
// HistorialFiltros, HistorialTabla y HistorialTarjetas solo muestran datos y le avisan lo que hace el usuario.
export default function HistorialSection() {
  // Respuesta del backend: los registros de la página actual y el total que coincide con los filtros
  const [registros, setRegistros] = useState([])
  const [total, setTotal] = useState(0)
  // Estado de la carga: 'cargando', 'listo' o 'error'
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  // Filtros aplicados (los que se mandaron con "Buscar") y página actual
  const [filtros, setFiltros] = useState({})
  const [pagina, setPagina] = useState(1)
  // id del registro seleccionado en la tabla (null = ninguno)
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  // Cada vez que este número cambia, la tabla se vuelve a pedir al backend
  const [recarga, setRecarga] = useState(0)
  // Qué popup está abierto: null (ninguno), 'crear' o 'modificar'
  const [formularioAbierto, setFormularioAbierto] = useState(null)
  // Mensaje de éxito o error sobre la tabla
  const [mensaje, setMensaje] = useState(null)
  // Vista elegida en el buscador: 'tabla' (registros médicos) o 'tarjetas' (un recuadro por animal)
  const [vista, setVista] = useState('tabla')
  // Animales de la vista de tarjetas. Se piden recién la primera vez que se abre esa vista
  const [animales, setAnimales] = useState([])
  const [estadoAnimales, setEstadoAnimales] = useState('sin-cargar')
  // Al cambiar este número el buscador se reinicia (ver la "key" de HistorialFiltros más abajo)
  const [versionBuscador, setVersionBuscador] = useState(0)

  // Se pide la lista al backend cada vez que cambian los filtros, la página o "recarga".
  // "cancelado" evita un problema clásico: si el usuario busca dos veces seguidas,
  // la primera respuesta podría llegar después de la segunda y mostrar datos viejos.
  // Al cambiar algo, React ejecuta la función de limpieza (el return) y la respuesta
  // anterior se ignora.
  useEffect(() => {
    let cancelado = false

    getHistoriales({ ...filtros, pagina, limite: REGISTROS_POR_PAGINA })
      .then((respuesta) => {
        if (cancelado) return
        setRegistros(respuesta.registros)
        setTotal(respuesta.total)
        setEstado('listo')
      })
      .catch((error) => {
        if (cancelado) return
        setErrorCarga(error.message)
        setEstado('error')
      })

    return () => {
      cancelado = true
    }
  }, [filtros, pagina, recarga])

  // Math.ceil redondea hacia arriba: 17 registros de a 15 son 2 páginas.
  // Math.max asegura que siempre haya al menos 1 página, aunque no haya registros.
  const totalPaginas = Math.max(1, Math.ceil(total / REGISTROS_POR_PAGINA))

  // Una búsqueda nueva siempre parte en la página 1 y sin fila seleccionada
  function buscar(nuevosFiltros) {
    setFiltros(nuevosFiltros)
    setPagina(1)
    setSeleccionadoId(null)
  }

  function cambiarPagina(nuevaPagina) {
    setPagina(nuevaPagina)
    setSeleccionadoId(null)
  }

  function cambiarVista(nuevaVista) {
    setVista(nuevaVista)
    setSeleccionadoId(null)
    if (nuevaVista === 'tarjetas' && estadoAnimales !== 'listo') cargarAnimales()
  }

  // Pide la lista de animales al backend (GET /api/animales) para armar las tarjetas
  async function cargarAnimales() {
    setEstadoAnimales('cargando')
    try {
      setAnimales(await getAnimales())
      setEstadoAnimales('listo')
    } catch (error) {
      setErrorCarga(error.message)
      setEstadoAnimales('error')
    }
  }

  // Al hacer click en una tarjeta se vuelve a la tabla mostrando solo los registros de ese animal.
  // Es lo mismo que escribir su nombre en el campo "Animal" y presionar "Buscar":
  // se mantienen los demás filtros (veterinario y fechas) y solo se cambia el animal.
  // Se suma 1 a versionBuscador para que el campo "Animal" muestre el nombre elegido.
  function elegirAnimal(animal) {
    buscar({ ...filtros, animal: animal.nombre_animal })
    setVista('tabla')
    setVersionBuscador(versionBuscador + 1)
  }

  // En la vista de tarjetas el campo "Animal" del buscador filtra las tarjetas por nombre.
  // Se hace aquí en el frontend con la misma regla que usa el backend para la tabla:
  // el texto puede estar en cualquier parte del nombre y no importan mayúsculas o minúsculas.
  const textoAnimal = (filtros.animal ?? '').trim().toLowerCase()
  const animalesVisibles = animales.filter((animal) =>
    animal.nombre_animal.toLowerCase().includes(textoAnimal),
  )

  // Se busca en la página actual el registro que tiene el id seleccionado
  const registroSeleccionado =
    registros.find((registro) => registro.id_historial === seleccionadoId) ?? null

  function abrirFormulario(tipo) {
    setMensaje(null)
    setFormularioAbierto(tipo)
  }

  // HistorialForm llama a esta función cuando el backend guardó el registro.
  // En vez de modificar la lista a mano, se vuelve a pedir la página al backend,
  // porque un registro nuevo o con otra fecha puede cambiar de posición en la tabla.
  function registroGuardado() {
    setMensaje({
      tipo: 'exito',
      texto: formularioAbierto === 'crear' ? 'Registro médico añadido' : 'Registro médico modificado',
    })
    setFormularioAbierto(null)
    setRecarga(recarga + 1)
  }

  async function eliminarSeleccionado() {
    if (!registroSeleccionado) return

    // window.confirm muestra un aviso del navegador con "Aceptar" y "Cancelar"
    const confirmado = window.confirm(
      `¿Eliminar el registro "${registroSeleccionado.tratamiento}" de ${registroSeleccionado.animal.nombre_animal}?`,
    )
    if (!confirmado) return

    setMensaje(null)
    try {
      await eliminarHistorial(registroSeleccionado.id_historial)
      setSeleccionadoId(null)
      setMensaje({ tipo: 'exito', texto: 'Registro médico eliminado' })
      // Si se borró el único registro de la última página, se vuelve a la página anterior
      // (cambiar la página ya recarga la tabla); si no, se recarga la misma página.
      if (registros.length === 1 && pagina > 1) setPagina(pagina - 1)
      else setRecarga(recarga + 1)
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    }
  }

  return (
    <>
      <div
        className="area-actions area-actions--historial-medico"
        role="group"
        aria-label="Acciones del historial médico"
      >
        <button className="area-action" type="button" onClick={() => abrirFormulario('crear')}>
          Añadir Registro
        </button>
        {/* Modificar y eliminar necesitan una fila seleccionada, si no, quedan desactivados */}
        <button
          className="area-action"
          type="button"
          onClick={() => abrirFormulario('modificar')}
          disabled={!registroSeleccionado}
        >
          Modificar Registro
        </button>
        <button
          className="area-action"
          type="button"
          onClick={eliminarSeleccionado}
          disabled={!registroSeleccionado}
        >
          Eliminar Registro
        </button>
        {!registroSeleccionado && (
          <p className="historial-ayuda">
            Selecciona un registro en la tabla para modificarlo o eliminarlo.
          </p>
        )}
      </div>

      <div className="historial-contenido" aria-busy={estado === 'cargando'}>
        {/* La "key" es especial en React: si cambia, React descarta el buscador y crea uno
            nuevo, que vuelve a leer valoresIniciales. Así se reinicia con el animal elegido. */}
        <HistorialFiltros
          key={versionBuscador}
          valoresIniciales={filtros}
          onBuscar={buscar}
          vista={vista}
          onCambiarVista={cambiarVista}
        />

        {mensaje && (
          <p className={`historial-mensaje historial-mensaje--${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </p>
        )}

        {vista === 'tarjetas' && (
          <>
            {estadoAnimales === 'cargando' && <p role="status">Cargando animales...</p>}
            {estadoAnimales === 'error' && (
              <p className="historial-mensaje historial-mensaje--error" role="alert">
                No se pudieron cargar los animales: {errorCarga}
              </p>
            )}
            {estadoAnimales === 'listo' && (
              <HistorialTarjetas animales={animalesVisibles} onElegirAnimal={elegirAnimal} />
            )}
          </>
        )}

        {vista === 'tabla' && estado === 'cargando' && <p role="status">Cargando historial médico...</p>}
        {vista === 'tabla' && estado === 'error' && (
          <p className="historial-mensaje historial-mensaje--error" role="alert">
            No se pudo cargar el historial médico: {errorCarga}
          </p>
        )}
        {vista === 'tabla' && estado === 'listo' && (
          <HistorialTabla
            registros={registros}
            total={total}
            pagina={pagina}
            totalPaginas={totalPaginas}
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
            onCambiarPagina={cambiarPagina}
          />
        )}
      </div>

      {formularioAbierto && (
        <HistorialForm
          registro={formularioAbierto === 'modificar' ? registroSeleccionado : null}
          onClose={() => setFormularioAbierto(null)}
          onSaved={registroGuardado}
        />
      )}
    </>
  )
}