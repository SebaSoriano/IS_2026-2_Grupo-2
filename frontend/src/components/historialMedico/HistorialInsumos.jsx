import { useEffect, useState } from 'react'
import { getInsumos } from '../../services/api.js'
import { cantidadConUnidad, nombreInsumo, textoEstadoEnvase } from '../../utils/insumos.js'
import { hoyIso } from '../../utils/fechas.js'
import './HistorialInsumos.css'

// un insumo está vencido si su fecha de vencimiento (AAAA-MM-DD) es anterior a hoy.
// Comparar textos AAAA-MM-DD funciona porque el año va primero, después el mes y después el día.
function estaVencido(insumo) {
  return insumo.fecha_vencimiento != null && insumo.fecha_vencimiento.slice(0, 10) < hoyIso()
}

// ordena el inventario por tipo y después por nombre, para que la lista sea fácil de recorrer.
// localeCompare compara textos respetando las tildes y la ñ del español.
function ordenarInventario(insumos) {
  return [...insumos].sort(
    (a, b) =>
      a.tipo_insumo.localeCompare(b.tipo_insumo, 'es') ||
      nombreInsumo(a).localeCompare(nombreInsumo(b), 'es'),
  )
}

// agrupa los insumos por tipo: { 'Alimentación': [insumo, insumo], 'Salud': [insumo] }.
// Se usa para mostrar la lista desplegable separada en grupos (etiqueta optgroup).
function agruparPorTipo(insumos) {
  const grupos = {}
  for (const insumo of insumos) {
    if (!grupos[insumo.tipo_insumo]) grupos[insumo.tipo_insumo] = []
    grupos[insumo.tipo_insumo].push(insumo)
  }
  return grupos
}

// los insumos de tipo "estado" (frascos, bidones) no piden cantidad: solo se registra que se usaron
const esDeEstado = (insumo) => insumo.tipo_control === 'estado'

// Lo que se ve en la lista desplegable al lado del nombre: cuánto queda (contables)
// o en qué estado está el envase y cuántos envases hay (de estado).
function detalleEnLista(insumo, disponible) {
  if (esDeEstado(insumo)) {
    return `${textoEstadoEnvase(insumo)}, ${cantidadConUnidad(insumo.cantidad, 'unidad')}`
  }
  return `quedan ${cantidadConUnidad(disponible, insumo.unidad_medida)}`
}

// Selector de los insumos usados en un tratamiento. Muestra el inventario en una 
// lista desplegable
export default function HistorialInsumos({
  elegidos,
  onChange,
  usadosAntes = [],
  mensajeVacio = 'Opcional: si no se usaron insumos, deja esta parte vacía.',
}) {
  const [inventario, setInventario] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  // insumo y cantidad que se están por agregar (la fila de arriba del selector)
  const [idNuevo, setIdNuevo] = useState('')
  const [cantidadNueva, setCantidadNueva] = useState('1')

  // se carga el inventario una vez, cuando se abre el formulario
  useEffect(() => {
    getInsumos()
      .then((insumos) => setInventario(ordenarInventario(insumos)))
      .catch(() => setErrorCarga('No se pudo cargar el inventario'))
      .finally(() => setCargando(false))
  }, [])

  // un Map permite buscar un insumo por su id sin recorrer toda la lista cada vez
  const insumoPorId = new Map(inventario.map((insumo) => [insumo.id, insumo]))
  const idsElegidos = new Set(elegidos.map((elegido) => elegido.id_insumo))
  const cantidadUsadaAntes = new Map(usadosAntes.map((uso) => [uso.id_insumo, uso.cantidad]))

  // cuánto de un insumo se puede usar en este registro:
  // lo que queda en el inventario más lo que este mismo registro ya tenía descontado
  const disponible = (insumo) => insumo.cantidad + (cantidadUsadaAntes.get(insumo.id) ?? 0)

  // un insumo se puede elegir si tiene stock: los contables si les queda cantidad,
  // y los de estado si su envase no está terminado (cerrado o abierto)
  const sePuedeUsar = (insumo) =>
    esDeEstado(insumo) ? insumo.estado_envase !== 'terminado' && insumo.cantidad > 0 : disponible(insumo) > 0

  // en la lista desplegable solo aparecen los insumos con stock que todavía no se agregaron
  const disponibles = inventario.filter(
    (insumo) => sePuedeUsar(insumo) && !idsElegidos.has(insumo.id),
  )
  const insumoNuevo = insumoPorId.get(Number(idNuevo))

  function agregar() {
    if (!insumoNuevo) return
    // un insumo de estado se agrega sin cantidad (null): el backend solo registra que se usó
    // y, si el envase estaba cerrado, lo marca como abierto
    if (esDeEstado(insumoNuevo)) {
      onChange([...elegidos, { id_insumo: insumoNuevo.id, cantidad: null }])
      setIdNuevo('')
      return
    }
    // Si se escribió algo fuera de rango, se ajusta: mínimo 1 y máximo lo que hay en el inventario.
    // Math.max pone el piso y Math.min pone el techo.
    const cantidad = Math.min(Math.max(1, Number.parseInt(cantidadNueva, 10) || 1), disponible(insumoNuevo))
    // [...elegidos, nuevo] crea una lista NUEVA con lo que ya había más el insumo nuevo.
    // En React el estado no se modifica con push: se reemplaza, y así React sabe que debe volver a dibujar.
    onChange([...elegidos, { id_insumo: insumoNuevo.id, cantidad: String(cantidad) }])
    // se limpia la fila para agregar el siguiente insumo
    setIdNuevo('')
    setCantidadNueva('1')
  }

  // map devuelve la misma lista con un solo elemento cambiado
  function cambiarCantidad(id_insumo, cantidad) {
    onChange(
      elegidos.map((elegido) => (elegido.id_insumo === id_insumo ? { ...elegido, cantidad } : elegido)),
    )
  }

  // filter devuelve la lista sin ese elemento
  function quitar(id_insumo) {
    onChange(elegidos.filter((elegido) => elegido.id_insumo !== id_insumo))
  }

  if (cargando) return <p className="historial-insumos__ayuda">Cargando inventario...</p>
  if (errorCarga) return <p className="animal-form__error">{errorCarga}</p>

  return (
    <div className="historial-insumos">
      <div className="historial-insumos__nuevo">
        <label className="animal-form__field">
          Insumo
          <select value={idNuevo} onChange={(event) => setIdNuevo(event.target.value)}>
            <option value="">
              {disponibles.length === 0 ? 'No quedan insumos con stock' : 'Selecciona un insumo'}
            </option>
            {/* Object.entries convierte { tipo: [insumos] } en una lista de pares [tipo, insumos] */}
            {Object.entries(agruparPorTipo(disponibles)).map(([tipo, insumos]) => (
              <optgroup label={tipo} key={tipo}>
                {insumos.map((insumo) => (
                  <option value={insumo.id} key={insumo.id}>
                    {nombreInsumo(insumo)} ({detalleEnLista(insumo, disponible(insumo))})
                    {estaVencido(insumo) ? ' - VENCIDO' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="animal-form__field historial-insumos__cantidad">
          Cantidad
          <input
            type="number"
            min={1}
            max={insumoNuevo ? disponible(insumoNuevo) : undefined}
            value={insumoNuevo && esDeEstado(insumoNuevo) ? '' : cantidadNueva}
            onChange={(event) => setCantidadNueva(event.target.value)}
            // los insumos de estado no llevan cantidad, por eso el campo se desactiva
            disabled={!insumoNuevo || esDeEstado(insumoNuevo)}
            placeholder={insumoNuevo && esDeEstado(insumoNuevo) ? 'No aplica' : undefined}
          />
        </label>

        <button
          className="historial-insumos__agregar"
          type="button"
          onClick={agregar}
          disabled={!insumoNuevo}
        >
          Agregar
        </button>
      </div>

      {elegidos.length === 0 ? (
        <p className="historial-insumos__ayuda">{mensajeVacio}</p>
      ) : (
        <ul className="historial-insumos__lista" aria-label="Insumos agregados a este registro">
          {elegidos.map((elegido) => {
            const insumo = insumoPorId.get(elegido.id_insumo)
            // Si el insumo ya no está en el inventario (por ejemplo, otra persona lo borró
            // mientras el formulario estaba abierto) no se puede mostrar su nombre ni su stock
            if (!insumo) return null
            return (
              <li className="historial-insumos__item" key={elegido.id_insumo}>
                <span className="historial-insumos__nombre">
                  {nombreInsumo(insumo)}
                  <small>{insumo.tipo_insumo}</small>
                </span>
                {esDeEstado(insumo) ? (
                  // de estado: en vez de cantidad se muestra el estado del envase.
                  // span con dos columnas (ver HistorialInsumos.css) ocupa el lugar del input y del "de N"
                  <span className="historial-insumos__estado">
                    Se registra el uso ({textoEstadoEnvase(insumo).toLowerCase()})
                  </span>
                ) : (
                  <>
                    {/* min, max y required hacen que el navegador no deje guardar
                        una cantidad menor que 1 o mayor que el stock disponible */}
                    <input
                      type="number"
                      aria-label={`Cantidad de ${nombreInsumo(insumo)}`}
                      min={1}
                      max={disponible(insumo)}
                      value={elegido.cantidad}
                      onChange={(event) => cambiarCantidad(elegido.id_insumo, event.target.value)}
                      required
                    />
                    <span className="historial-insumos__stock">
                      de {cantidadConUnidad(disponible(insumo), insumo.unidad_medida)}
                    </span>
                  </>
                )}
                <button
                  className="historial-insumos__quitar"
                  type="button"
                  onClick={() => quitar(elegido.id_insumo)}
                  aria-label={`Quitar ${nombreInsumo(insumo)}`}
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}