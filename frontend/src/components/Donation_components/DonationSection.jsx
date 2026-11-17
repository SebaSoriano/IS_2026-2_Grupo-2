import { useEffect, useState } from 'react'
import { API_BASE_URL, getDonaciones } from '../../services/api.js'
import { ROLES } from '../../data/permisos.js'
import { usePermisos, useSesion } from '../../sesion/sesion.js'
import DonationAgendarModal from './DonationAgendarModal.jsx'
import DonationConfirmarModal from './DonationConfirmarModal.jsx'
import DonationPresencialForm from './DonationFormPresencial.jsx'
import DonationEditarModal from './DonationEditarModal.jsx'
import DonationEliminarModal from './DonationEliminarModal.jsx'
import DonationStats from '../DonationStats.jsx'
import './DonationSection.css'

const OPCIONES_FILTRO = {
  estado: ['pendiente', 'agendada', 'confirmada'],
  origen: ['presencial', 'web'],
}

const ETIQUETAS_FILTRO = {
  estado: 'Estado',
  origen: 'Origen',
}

const formatoPesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

// fecha_donacion es un instante exacto: se muestra en la hora del navegador
function formatoFechaHora(valor) {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
}

// fecha_agendada se guarda como día a las 00:00 UTC: se muestra en UTC para que no retroceda un día
function formatoDia(valor) {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC' }).format(new Date(valor))
}

function detalleDonacion(donacion) {
  if (donacion.tipo_donacion === 'monetaria') {
    return `${formatoPesos.format(donacion.monto_donacion)} · ${donacion.metodo_pago}`
  }
  return donacion.descripcion_insumos
}

// el donante es opcional en las presenciales: si no dejó su nombre, se muestra como anónimo
function nombreDonante(donacion) {
  return donacion.donante_nombre || (donacion.origen === 'presencial' ? 'Anónimo' : '—')
}

// 3 vistas, donaciones monetarias, de insumos y estadisticas.
const VISTAS = [
  { clave: 'monetaria', etiqueta: 'Monetarias' },
  { clave: 'insumos', etiqueta: 'Insumos' },
  { clave: 'estadisticas', etiqueta: 'Estadísticas' },
]

const celdaEstado = (d) => (
  <span className={`donation-badge donation-badge--${d.estado}`}>{d.estado}</span>
)
const celdaRecibidaPor = (d) => d.usuario?.nombre_usuario ?? '—'
const celdaFecha = (d) => formatoFechaHora(d.fecha_donacion)

// cada columna: título y cómo se dibuja su celda a partir de la donación
const COLUMNAS = {
  monetaria: [
    { titulo: 'Donante', celda: nombreDonante },
    { titulo: 'Recibida por', celda: celdaRecibidaPor },
    { titulo: 'Monto y método', celda: detalleDonacion },
    {
      titulo: 'Cuenta',
      celda: (d) => (d.cuenta ? `${d.cuenta.banco} · ${d.cuenta.titular_nombre}` : '—'),
    },
    {
      titulo: 'Comprobante',
      celda: (d) =>
        d.comprobante_url ? (
          <a href={`${API_BASE_URL}/donaciones/${d.id_donacion}/comprobante`} target="_blank" rel="noreferrer">
            Ver
          </a>
        ) : (
          '—'
        ),
    },
    { titulo: 'Fecha', celda: celdaFecha },
    { titulo: 'Estado', celda: celdaEstado },
  ],
  insumos: [
    { titulo: 'Donante', celda: nombreDonante },
    { titulo: 'Recibida por', celda: celdaRecibidaPor },
    { titulo: 'Detalle', celda: detalleDonacion },
    { titulo: 'Fecha', celda: celdaFecha },
    { titulo: 'Agendada para', celda: (d) => formatoDia(d.fecha_agendada) },
    { titulo: 'Estado', celda: celdaEstado },
  ],
}
// Solo se agendan las de insumos que todavía están pendientes
const puedeAgendar = (donacion) => donacion.tipo_donacion === 'insumos' && donacion.estado === 'pendiente'

// Mismas reglas que el servidor (esto solo esconde el botón; el servidor responde 403 igual):
// - insumos: cualquiera con sesión
// - monetaria: el Admin o el voluntario titular de la cuenta a la que llegó la transferencia
const puedeConfirmar = (donacion, usuario) => {
  if (donacion.estado === 'confirmada') return false
  if (donacion.tipo_donacion === 'insumos') return true
  return usuario.rol === ROLES.ADMIN || donacion.cuenta?.rut_usuario === usuario.rut
}

// Botones de una fila. onAccion recibe el nombre de la acción elegida
function DonationAcciones({ donacion, usuario, onAccion }) {
  const agendar = puedeAgendar(donacion)
  const confirmar = puedeConfirmar(donacion, usuario)

  return (
    <div className="donation-acciones">
      {agendar && (
        <button type="button" className="donation-accion" onClick={() => onAccion('agendar')}>
          Agendar
        </button>
      )}
      {confirmar && (
        <button type="button" className="donation-accion donation-accion--confirmar" onClick={() => onAccion('confirmar')}>
          Confirmar
        </button>
      )}
      {!agendar && !confirmar && '—'}
    </div>
  )
}

export default function DonationSection() {
  const usuario = useSesion()
  const { puedeAgregar } = usePermisos()
  const [donaciones, setDonaciones] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [vista, setVista] = useState('monetaria')
  const [filtros, setFiltros] = useState({ estado: '', origen: '' })
  
  // cada vez que cambia este número se vuelve a pedir la lista (después de agendar o confirmar)
  const [recarga, setRecarga] = useState(0)
  // acción en curso: null, o { tipo: 'agendar' | 'confirmar' | 'editar' | 'eliminar', donacion }
  const [accion, setAccion] = useState(null)
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

    getDonaciones({ ...filtros, tipo_donacion: vista })
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
  const totalColumnas = columnasVista.length + 1 + (administrar ? 1 : 0) // +1 por "Acciones"

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
              </div>
            )}
          </div>

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
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {donaciones.length === 0 ? (
                    <tr>
                      <td className="inventory-empty" colSpan={totalColumnas}>No hay donaciones para mostrar.</td>
                    </tr>
                  ) : (
                    donaciones.map((donacion) => (
                      <tr key={donacion.id_donacion}>
                        {administrar && (
                          <td>
                            <input
                              type="checkbox"
                              checked={seleccionadas.has(donacion.id_donacion)}
                              onChange={() => alternarSeleccion(donacion.id_donacion)}
                              aria-label={`Seleccionar donación de ${nombreDonante(donacion)}`}
                            />
                          </td>
                        )}
                        {columnasVista.map((columna) => (
                          <td key={columna.titulo}>{columna.celda(donacion)}</td>
                        ))}
                        <td>
                          <DonationAcciones
                            donacion={donacion}
                            usuario={usuario}
                            onAccion={(tipo) => setAccion({ tipo, donacion })}
                          />
                        </td>
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
        </div>
      </div>
    </>
  )
}