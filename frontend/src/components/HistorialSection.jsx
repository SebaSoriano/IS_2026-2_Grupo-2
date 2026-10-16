import { useEffect, useState } from 'react'
import { eliminarHistorial, getHistoriales } from '../services/api.js'
import HistorialFiltros from './HistorialFiltros.jsx'
import HistorialForm from './HistorialForm.jsx'
import HistorialTabla from './HistorialTabla.jsx'
import './HistorialSection.css'

// Cantidad de registros por página. El backend acepta entre 1 y 100.
const REGISTROS_POR_PAGINA = 15

// Pestaña "Historial Médico". Este componente es el que guarda el estado y habla con el backend;
// HistorialFiltros y HistorialTabla solo muestran datos y le avisan lo que hace el usuario.
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
        <HistorialFiltros onBuscar={buscar} />

        {mensaje && (
          <p className={`historial-mensaje historial-mensaje--${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </p>
        )}

        {estado === 'cargando' && <p role="status">Cargando historial médico...</p>}
        {estado === 'error' && (
          <p className="historial-mensaje historial-mensaje--error" role="alert">
            No se pudo cargar el historial médico: {errorCarga}
          </p>
        )}
        {estado === 'listo' && (
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