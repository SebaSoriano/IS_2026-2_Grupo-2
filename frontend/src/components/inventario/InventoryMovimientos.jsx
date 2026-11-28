import { useEffect, useState } from 'react'
import { getMovimientosInventario } from '../../services/api.js'
import { cantidadConUnidad, nombreInsumo } from '../../utils/insumos.js'
import './InventoryMovimientos.css'

// fecha y hora del movimiento en formato chileno, por ejemplo "25-11-2026 20:43".
// A diferencia de las fechas del historial (que se guardan a las 00:00 UTC), la fecha del
// movimiento es el momento exacto en que se guardó, así que se muestra en la hora de Chile.
function fechaYHora(valor) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(new Date(valor))
}

// nombre que se ve en la columna Tipo para cada valor del enum TipoMovimiento de la base de datos
const nombreTipo = { salida: 'Salida', devolucion: 'Devolución' }

// Tabla de movimientos del inventario. Los movimientos se crean desde los registros
// que descuentan stock, por eso aquí no hay botones para agregarlos, modificarlos ni borrarlos.
export default function InventoryMovimientos() {
  const [movimientos, setMovimientos] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState('')

  // se piden los movimientos una vez, cuando aparece la sección de Inventario
  useEffect(() => {
    getMovimientosInventario()
      .then((datos) => {
        setMovimientos(datos)
        setEstado('listo')
      })
      .catch((errorPeticion) => {
        setError(errorPeticion.message)
        setEstado('error')
      })
  }, [])

  if (estado === 'cargando') return <p role="status">Cargando movimientos...</p>
  if (estado === 'error') {
    return (
      <p className="inventory-error" role="alert">
        No se pudieron cargar los movimientos: {error}
      </p>
    )
  }

  return (
    <div className="inventory-movimientos">
      {/* Se reutilizan las clases de la tabla de insumos (InventorySection.css) para que las dos se vean iguales */}
      <div className="inventory-table-scroll">
        <table className="inventory-table">
          <caption>Movimientos del inventario (últimos {movimientos.length})</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Tipo</th>
              <th scope="col">Insumo</th>
              <th scope="col">Cantidad</th>
              <th scope="col">Motivo</th>
              <th scope="col">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td className="inventory-empty" colSpan="6">
                  Todavía no hay movimientos. Aparecen al registrar insumos en el historial médico o en un consumo diario.
                </td>
              </tr>
            ) : (
              movimientos.map((movimiento) => (
                <tr key={movimiento.id_movimiento}>
                  <td>{fechaYHora(movimiento.fecha)}</td>
                  <td>
                    {/* la clase cambia el color: rojo para las salidas y verde para las devoluciones */}
                    <span className={`inventory-movimiento inventory-movimiento--${movimiento.tipo}`}>
                      {nombreTipo[movimiento.tipo]}
                    </span>
                  </td>
                  <td>{nombreInsumo(movimiento.insumo)}</td>
                  <td className="inventory-movimiento__cantidad">
                    {/* la salida se muestra con "-" y la devolución con "+", como en una cuenta */}
                    {movimiento.tipo === 'salida' ? '-' : '+'}
                    {cantidadConUnidad(movimiento.cantidad, movimiento.insumo.unidad_medida)}
                  </td>
                  <td>{movimiento.descripcion}</td>
                  <td>{movimiento.usuario.nombre_usuario}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}