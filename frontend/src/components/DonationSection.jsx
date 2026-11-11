import { useEffect, useState } from 'react'
import { API_BASE_URL, getDonaciones } from '../services/api.js'
import { ROLES } from '../data/permisos.js'
import { usePermisos, useSesion } from '../sesion/sesion.js'
import DonationAgendarModal from './DonationAgendarModal.jsx'
import DonationConfirmarModal from './DonationConfirmarModal.jsx'
import DonationPresencialForm from './DonationFormPresencial.jsx'
import DonationEditarModal from './DonationEditarModal.jsx'
import DonationEliminarModal from './DonationEliminarModal.jsx'
import './DonationSection.css'

const OPCIONES_FILTRO = {
  estado: ['pendiente', 'agendada', 'confirmada'],
  tipo_donacion: ['monetaria', 'insumos'],
  origen: ['presencial', 'web'],
}

const ETIQUETAS_FILTRO = {
  estado: 'Estado',
  tipo_donacion: 'Tipo',
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
  const [filtros, setFiltros] = useState({ estado: '', tipo_donacion: '', origen: '' })
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

  // se vuelve a pedir la lista cada vez que cambian los filtros o la recarga
  useEffect(() => {
    let esVigente = true

    getDonaciones(filtros)
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

    // si los filtros cambian antes de que llegue la respuesta, la antigua se descarta
    return () => {
      esVigente = false
    }
  }, [filtros, recarga])

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
  const columnas = administrar ? 13 : 12

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

      <div className="inventory-table-container" aria-busy={status === 'loading'}>
        {/* los filtros van fuera del estado de carga para que no desaparezcan al cambiarlos */}
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

        {status === 'loading' && <p role="status">Cargando donaciones...</p>}
        {status === 'error' && (
          <p className="inventory-error" role="alert">
            No se pudieron cargar las donaciones: {error}
          </p>
        )}
        {status === 'success' && (
          <div className="inventory-table-scroll">
            <table className="inventory-table">
              <caption>Donaciones registradas</caption>
              <thead>
                <tr>
                  {administrar && (
                    <th scope="col">
                      <span className="visually-hidden">Seleccionar donación</span>
                    </th>
                  )}
                  <th scope="col">ID</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Origen</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Donante</th>
                  <th scope="col">Recibida por</th>
                  <th scope="col">Detalle</th>
                  <th scope="col">Cuenta</th>
                  <th scope="col">Comprobante</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Agendada para</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {donaciones.length === 0 ? (
                  <tr>
                    <td className="inventory-empty" colSpan="{columnas}">No hay donaciones para mostrar.</td>
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
                            aria-label={`Seleccionar donación ${donacion.id_donacion}`}
                          />
                        </td>
                      )}
                      <td>{donacion.id_donacion}</td>
                      <td>{donacion.tipo_donacion}</td>
                      <td>{donacion.origen}</td>
                      <td>
                        <span className={`donation-badge donation-badge--${donacion.estado}`}>
                          {donacion.estado}
                        </span>
                      </td>
                      <td>{nombreDonante(donacion)}</td>
                      <td>{donacion.usuario?.nombre_usuario ?? '—'}</td>
                      <td>{detalleDonacion(donacion)}</td>
                      <td>
                        {donacion.cuenta ? `${donacion.cuenta.banco} · ${donacion.cuenta.titular_nombre}` : '—'}
                      </td>
                      <td>
                        {donacion.comprobante_url ? (
                          // el navegador manda la cookie de sesión solo, por eso el enlace funciona
                          <a
                            href={`${API_BASE_URL}/donaciones/${donacion.id_donacion}/comprobante`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{formatoFechaHora(donacion.fecha_donacion)}</td>
                      <td>{formatoDia(donacion.fecha_agendada)}</td>
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
    </>
  )
}