import { useEffect, useState } from 'react'
import { getDonaciones } from '../services/api.js'
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

export default function DonationSection() {
  const [donaciones, setDonaciones] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState({ estado: '', tipo_donacion: '', origen: '' })

  // se vuelve a pedir la lista cada vez que cambian los filtros
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
  }, [filtros])

  const cambiarFiltro = (clave, valor) => {
    setStatus('loading')
    setFiltros((actuales) => ({ ...actuales, [clave]: valor }))
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
                <th scope="col">Fecha</th>
                <th scope="col">Agendada para</th>
              </tr>
            </thead>
            <tbody>
              {donaciones.length === 0 ? (
                <tr>
                  <td className="inventory-empty" colSpan="8">No hay donaciones para mostrar.</td>
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
                    <td>{formatoFechaHora(donacion.fecha_donacion)}</td>
                    <td>{formatoDia(donacion.fecha_agendada)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}