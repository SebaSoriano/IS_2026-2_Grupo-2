import { useEffect, useState } from 'react'
import { getConsumosDiarios } from '../../services/api.js'
import { cantidadConUnidad, nombreInsumo } from '../../utils/insumos.js'
import './InventoryConsumosDiarios.css'

function fechaYHora(valor) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(new Date(valor))
}

function detalleInsumo({ cantidad, insumo }) {
  if (cantidad == null) {
    return `${nombreInsumo(insumo)} — uso registrado; el envase se descuenta al marcarlo como terminado`
  }
  return `${nombreInsumo(insumo)} — ${cantidadConUnidad(cantidad, insumo.unidad_medida)}`
}

export default function InventoryConsumosDiarios() {
  const [consumos, setConsumos] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true

    getConsumosDiarios()
      .then((datos) => {
        if (!vigente) return
        setConsumos(datos)
        setEstado('listo')
      })
      .catch((requestError) => {
        if (!vigente) return
        setError(requestError.message)
        setEstado('error')
      })

    return () => {
      vigente = false
    }
  }, [])

  if (estado === 'cargando') return <p role="status">Cargando consumos diarios...</p>
  if (estado === 'error') {
    return (
      <p className="inventory-error" role="alert">
        No se pudieron cargar los consumos diarios: {error}
      </p>
    )
  }

  return (
    <div className="inventory-table-scroll">
      <table className="inventory-table">
        <caption>Consumos diarios (últimos {consumos.length}, máximo 100)</caption>
        <thead>
          <tr>
            <th scope="col">Fecha y hora</th>
            <th scope="col">Insumos utilizados</th>
            <th scope="col">Registrado por</th>
          </tr>
        </thead>
        <tbody>
          {consumos.length === 0 ? (
            <tr>
              <td className="inventory-empty" colSpan="3">
                Todavía no hay consumos diarios registrados.
              </td>
            </tr>
          ) : (
            consumos.map((consumo) => (
              <tr key={consumo.id_consumo_diario}>
                <td>{fechaYHora(consumo.fecha)}</td>
                <td>
                  <ul className="inventory-consumos__lista">
                    {consumo.insumos.map((detalle) => (
                      <li key={detalle.id_insumo}>{detalleInsumo(detalle)}</li>
                    ))}
                  </ul>
                </td>
                <td>{consumo.usuario.nombre_usuario}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
