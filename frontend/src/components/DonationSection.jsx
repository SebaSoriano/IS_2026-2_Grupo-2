import { useEffect, useState } from 'react'
import { API_BASE_URL, getDonaciones } from '../services/api.js'
import { ROLES } from '../data/permisos.js'
import { useSesion } from '../sesion/sesion.js'
import DonationAgendarModal from './DonationAgendarModal.jsx'
import DonationConfirmarModal from './DonationConfirmarModal.jsx'
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

// las web traen los datos del donante; las presenciales, el voluntario que las registró
function nombreDonante(donacion) {
  return donacion.donante_nombre || donacion.usuario?.nombre_usuario || '—'
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

export default function DonationSection() {
  const usuario = useSesion()
  const [donaciones, setDonaciones] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState({ estado: '', tipo_donacion: '', origen: '' })
  // cada vez que cambia este número se vuelve a pedir la lista (después de agendar o confirmar)
  const [recarga, setRecarga] = useState(0)
  // acción en curso: null, o { tipo: 'agendar' | 'confirmar', donacion }
  const [accion, setAccion] = useState(null)

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

  // la acción salió bien: se cierra el pop-up y se actualiza la tabla
  const accionTerminada = () => {
    setAccion(null)
    setRecarga((n) => n + 1)
  }

  return (
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
                <th scope="col">ID</th>
                <th scope="col">Tipo</th>
                <th scope="col">Origen</th>
                <th scope="col">Estado</th>
                <th scope="col">Donante</th>
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
                  <td className="inventory-empty" colSpan="11">No hay donaciones para mostrar.</td>
                </tr>
              ) : (
                donaciones.map((donacion) => (
                  <tr key={donacion.id_donacion}>
                    <td>{donacion.id_donacion}</td>
                    <td>{donacion.tipo_donacion}</td>
                    <td>{donacion.origen}</td>
                    <td>
                      <span className={`donation-badge donation-badge--${donacion.estado}`}>
                        {donacion.estado}
                      </span>
                    </td>
                    <td>{nombreDonante(donacion)}</td>
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
                      <div className="donation-acciones">
                        {puedeAgendar(donacion) && (
                          <button
                            type="button"
                            className="donation-accion"
                            onClick={() => setAccion({ tipo: 'agendar', donacion })}
                          >
                            Agendar
                          </button>
                        )}
                        {puedeConfirmar(donacion, usuario) && (
                          <button
                            type="button"
                            className="donation-accion donation-accion--confirmar"
                            onClick={() => setAccion({ tipo: 'confirmar', donacion })}
                          >
                            Confirmar
                          </button>
                        )}
                        {!puedeAgendar(donacion) && !puedeConfirmar(donacion, usuario) && '—'}
                      </div>
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
    </div>
  )
}