import { useEffect, useState } from 'react'
import { ROLES } from '../../data/permisos.js'
import { usePermisos, useSesion } from '../../sesion/sesion.js'
import DonationAgendarModal from './DonationAgendarModal.jsx'
import DonationConfirmarModal from './DonationConfirmarModal.jsx'
import DonationPresencialForm from './DonationFormPresencial.jsx'
import DonationEditarModal from './DonationEditarModal.jsx'
import DonationEliminarModal from './DonationEliminarModal.jsx'
import DonationStats from './DonationStats.jsx'
import './DonationSection.css'
import { getDonaciones } from '../../services/api.js'
import DonationDetalleModal from './DonationDetalleModal.jsx'
import { detalleDonacion, formatoDia, formatoFechaHora, nombreDonante } from './DonationFormato.js'
import { CATEGORIAS_INSUMO } from '../../data/categoriasInsumo.js'
const OPCIONES_FILTRO = {
  estado: ['pendiente', 'agendada', 'confirmada'],
  origen: ['presencial', 'web'],
}

const ETIQUETAS_FILTRO = {
  estado: 'Estado',
  origen: 'Origen',
}

const FILTROS_VACIOS = { estado: '', origen: '', categoria_insumo: '', fecha_desde: '', fecha_hasta: '' }

const rangoDeFechas = ({ fecha_desde, fecha_hasta }) => ({
  fecha_desde: fecha_desde ? new Date(`${fecha_desde}T00:00:00`).toISOString() : '',
  fecha_hasta: fecha_hasta ? new Date(`${fecha_hasta}T23:59:59.999`).toISOString() : '',
})

// 3 vistas, donaciones monetarias, de insumos y estadisticas.
const VISTAS = [
  { clave: 'monetaria', etiqueta: 'Monetarias' },
  { clave: 'insumos', etiqueta: 'Insumos' },
  { clave: 'estadisticas', etiqueta: 'Estadísticas' },
]

const celdaFecha = (d) => formatoFechaHora(d.fecha_donacion)
const celdaEstado = (d) => (
  <span className={`donation-badge donation-badge--${d.estado}`}>{d.estado}</span>
)

// el nombre es un botón: así se puede abrir el detalle con el teclado
const celdaDonante = (d, abrir) => (
  <button type="button" className="donation-fila__abrir" onClick={() => abrir(d)}>
    {nombreDonante(d)}
  </button>
)

// en la tabla solo va lo representativo; el resto está en el modal de detalle
const COLUMNAS = {
  monetaria: [
    { titulo: 'Donante', celda: celdaDonante },
    { titulo: 'Monto y método', celda: (d) => detalleDonacion(d) },
    { titulo: 'Fecha', celda: celdaFecha },
    { titulo: 'Estado', celda: celdaEstado },
  ],
  insumos: [
    { titulo: 'Donante', celda: celdaDonante },
    {
      titulo: 'Detalle',
      celda: (d) => (
        <div className="donation-celda-detalle" title={d.descripcion_insumos}>
          {d.descripcion_insumos}
        </div>
      ),
    },
    { titulo: 'Fecha', celda: celdaFecha },
    { titulo: 'Estado', celda: celdaEstado },
  ],
}


export default function DonationSection() {
  const usuario = useSesion()
  const { puedeAgregar } = usePermisos()
  const [donaciones, setDonaciones] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [vista, setVista] = useState('monetaria')
 const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  
  // cada vez que cambia este número se vuelve a pedir la lista (después de agendar o confirmar)
  const [recarga, setRecarga] = useState(0)
  // acción en curso: null, o { tipo: 'agendar' | 'confirmar' | 'editar' | 'eliminar', donacion }
  const [accion, setAccion] = useState(null)
  // donación abierta en el modal de detalle (null si no hay ninguna)
const [detalle, setDetalle] = useState(null)
  // true mientras está abierto el pop-up de registrar una donación presencial
  const [registrando, setRegistrando] = useState(false)
  // solo Admin edita y elimina
  const administrar = usuario.rol === ROLES.ADMIN
  // ids de las donaciones marcadas con la casilla
  const [seleccionadas, setSeleccionadas] = useState(() => new Set())

  useEffect(() => {
  // las estadísticas traen sus propios datos: no hay lista que pedir
    if (vista === 'estadisticas') return

    let esVigente = true

    getDonaciones({
      ...filtros,
      ...rangoDeFechas(filtros),
      // la categoría solo existe en insumos
      categoria_insumo: vista === 'insumos' ? filtros.categoria_insumo : '',
      tipo_donacion: vista,
    })
      .then((data) => {
        if (!esVigente) return
        setDonaciones(data)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!esVigente) return
        setError(requestError.message)
        setStatus('error')
      })
    return () => {
      esVigente = false
    }
  }, [filtros, vista, recarga])

  const cambiarVista = (nueva) => {
    if (nueva === vista) return
    // al cambiar de tabla se limpia la selección: las filas marcadas ya no se ven
    setSeleccionadas(new Set())
    if (nueva !== 'estadisticas') setStatus('loading')
    setVista(nueva)
  }

  const cambiarFiltro = (clave, valor) => {
    setStatus('loading')
    setFiltros((actuales) => ({ ...actuales, [clave]: valor }))
  }
  const hayFiltros = Object.values(filtros).some(Boolean)

  const limpiarFiltros = () => {
    setStatus('loading')
    setFiltros(FILTROS_VACIOS)
  }

  const cerrarAccion = () => setAccion(null)

  // la acción salió bien: se cierra el pop-up, se limpia la selección y se actualiza la tabla
  const accionTerminada = () => {
    setAccion(null)
    setRegistrando(false)
    setSeleccionadas(new Set())
    setRecarga((n) => n + 1)
  }

  const alternarSeleccion = (id) => {
    setSeleccionadas((actuales) => {
      const siguientes = new Set(actuales)
      if (siguientes.has(id)) siguientes.delete(id)
      else siguientes.add(id)
      return siguientes
    })
  }

  // se calcula desde la lista visible: si un filtro esconde una fila, no cuenta como seleccionada
  const seleccionadasLista = donaciones.filter((donacion) => seleccionadas.has(donacion.id_donacion))
  const columnasVista = COLUMNAS[vista] ?? []
  const totalColumnas = columnasVista.length + (administrar ? 1 : 0)

  return (
    <>
      <div className="area-actions area-actions--donaciones" role="group" aria-label="Acciones de donaciones">
        {/* registrar una donación presencial es agregar un registro: lo pueden hacer todos los roles */}
        {puedeAgregar && (
          <button className="area-action" type="button" onClick={() => setRegistrando(true)}>
            Registrar Donación
          </button>
        )}
        {/* modificar y eliminar: solo Admin, y según las casillas marcadas (igual que Inventario) */}
        {administrar && (
          <>
            <button
              className="area-action"
              type="button"
              disabled={seleccionadasLista.length !== 1}
              onClick={() => setAccion({ tipo: 'editar', donacion: seleccionadasLista[0] })}
            >
              Modificar Donación
            </button>
            <button
              className="area-action"
              type="button"
              disabled={seleccionadasLista.length === 0}
              onClick={() => setAccion({ tipo: 'eliminar', donaciones: seleccionadasLista })}
            >
              Eliminar Donación
            </button>
          </>
        )}
      </div>

      {/* la sección es una grilla de 2 columnas (botones | contenido): el contenido va en un solo bloque */}
      <div className="donation-contenido">
        <div className="inventory-table-container" aria-busy={status === 'loading' && vista !== 'estadisticas'}>
          {/* botones de vista y filtros, en la misma fila */}
          <div className="donation-barra">
            <div className="donation-vistas" role="group" aria-label="Vista de donaciones">
              {VISTAS.map(({ clave, etiqueta }) => (
                <button
                  key={clave}
                  type="button"
                  className="donation-vista"
                  aria-pressed={vista === clave}
                  onClick={() => cambiarVista(clave)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            
            {vista !== 'estadisticas' && (
              <div className="donation-filters">
                {Object.entries(OPCIONES_FILTRO).map(([clave, opciones]) => (
                  <label key={clave}>
                    <span>{ETIQUETAS_FILTRO[clave]}</span>
                    <select value={filtros[clave]} onChange={(event) => cambiarFiltro(clave, event.target.value)}>
                      <option value="">Todos</option>
                      {opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                  </label>
                ))}

                {/* siempre se dibuja (en Monetarias queda desactivada): así los demás filtros no cambian de lugar */}
                <label className="donation-filters__categoria">
                  <span>Categoría</span>
                  <select
                    value={vista === 'insumos' ? filtros.categoria_insumo : ''}
                    disabled={vista !== 'insumos'}
                    onChange={(event) => cambiarFiltro('categoria_insumo', event.target.value)}
                  >
                    <option value="">Todas</option>
                    {CATEGORIAS_INSUMO.map((categoria) => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Desde</span>
                  <input
                    type="date"
                    value={filtros.fecha_desde}
                    max={filtros.fecha_hasta || undefined}
                    onChange={(event) => cambiarFiltro('fecha_desde', event.target.value)}
                  />
                </label>
                <label>
                  <span>Hasta</span>
                  <input
                    type="date"
                    value={filtros.fecha_hasta}
                    min={filtros.fecha_desde || undefined}
                    onChange={(event) => cambiarFiltro('fecha_hasta', event.target.value)}
                  />
                </label>

                {/* también siempre presente: sin filtros queda invisible pero reserva su espacio */}
                <button
                  type="button"
                  className="donation-filters__limpiar"
                  onClick={limpiarFiltros}
                  disabled={!hayFiltros}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
          {vista === 'insumos' && filtros.categoria_insumo && (
            <p className="donation-nota">
              La categoría se conoce cuando los insumos ya fueron recibidos: las donaciones pendientes o agendadas
              no aparecen al filtrar por categoría.
            </p>
          )}
          {vista === 'estadisticas' && <DonationStats recarga={recarga} />}
          {vista !== 'estadisticas' && status === 'loading' && <p role="status">Cargando donaciones...</p>}
          {vista !== 'estadisticas' && status === 'error' && (
            <p className="inventory-error" role="alert">
              No se pudieron cargar las donaciones: {error}
            </p>
          )}
          {vista !== 'estadisticas' && status === 'success' && (
            <div className="inventory-table-scroll">
              <table className="inventory-table">
                <caption>
                  {vista === 'monetaria' ? 'Donaciones monetarias' : 'Donaciones de insumos'}
                </caption>
                <thead>
                  <tr>
                    {administrar && (
                      <th scope="col">
                        <span className="visually-hidden">Seleccionar donación</span>
                      </th>
                    )}
                    {columnasVista.map((columna) => (
                      <th key={columna.titulo} scope="col">{columna.titulo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donaciones.length === 0 ? (
                    <tr>
                      <td className="inventory-empty" colSpan={totalColumnas}>No hay donaciones para mostrar.</td>
                    </tr>
                  ) : (
                    donaciones.map((donacion) => (
                      <tr key={donacion.id_donacion} className="donation-fila" onClick={() => setDetalle(donacion)}>
                        {administrar && (
                          <td onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={seleccionadas.has(donacion.id_donacion)}
                              onChange={() => alternarSeleccion(donacion.id_donacion)}
                              aria-label={`Seleccionar donación de ${nombreDonante(donacion)}`}
                            />
                          </td>
                        )}
                        {columnasVista.map((columna) => (
                          <td key={columna.titulo}>{columna.celda(donacion, setDetalle)}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {/* aquí siguen, sin cambios, los {accion?.tipo === ... && <Modal />} y {registrando && ...} */}
          {accion?.tipo === 'agendar' && (
            <DonationAgendarModal donacion={accion.donacion} onClose={cerrarAccion} onListo={accionTerminada} />
            )}
          {accion?.tipo === 'confirmar' && (
            <DonationConfirmarModal donacion={accion.donacion} onClose={cerrarAccion} onListo={accionTerminada} />
          )}
          {accion?.tipo === 'editar' && (
            <DonationEditarModal donacion={accion.donacion} onClose={cerrarAccion} onListo={accionTerminada} />
          )}
          {accion?.tipo === 'eliminar' && (
            <DonationEliminarModal donaciones={accion.donaciones} onClose={cerrarAccion} onListo={accionTerminada} />
          )}
          {registrando && (
            <DonationPresencialForm onClose={() => setRegistrando(false)} onListo={accionTerminada} />
          )}
          {detalle && (
            <DonationDetalleModal
              donacion={detalle}
              usuario={usuario}
              onClose={() => setDetalle(null)}
              onAccion={(tipo) => {
                // se cierra el detalle y se abre el pop-up de la acción elegida
                setAccion({ tipo, donacion: detalle })
                setDetalle(null)
              }}
            />
          )}
        </div>
      </div>
    </>
  )
}