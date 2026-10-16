import { useEffect, useState } from 'react'
import { getHistoriales } from '../services/api.js'
import HistorialFiltros from './HistorialFiltros.jsx'
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

  // se pide la lista al backend cada vez que cambian los filtros o la página.
  // "cancelado" evita un problema clásico: si el usuario busca dos veces seguidas,
  // la primera respuesta podría llegar después de la segunda y mostrar datos viejos.
  // al cambiar algo, React ejecuta la función de limpieza (el return) y la respuesta
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
  }, [filtros, pagina])

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

  return (
    <>
      <div
        className="area-actions area-actions--historial-medico"
        role="group"
        aria-label="Acciones del historial médico"
      >
        {/* Aquí van los botones de añadir, modificar y eliminar (siguiente commit) */}
      </div>

      <div className="historial-contenido" aria-busy={estado === 'cargando'}>
        <HistorialFiltros onBuscar={buscar} />

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
    </>
  )
}