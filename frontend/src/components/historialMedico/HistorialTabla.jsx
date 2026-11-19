import { formatearFecha } from '../../utils/fechas.js'
// formatearFecha muestra las fechas en formato chileno DD-MM-AAAA (ver utils/fechas.js)

// Texto de la columna Insumos. Por ahora el backend siempre entrega una lista vacía
function textoInsumos(insumos) {
  if (!insumos || insumos.length === 0) return 'Sin registrar'
  return insumos.map((insumo) => insumo.tipo_insumo).join(', ')
}

// Tabla del historial médico con su paginación. Este componente solo muestra datos:
// no pide nada al backend
export default function HistorialTabla({
  registros,
  total,
  pagina,
  totalPaginas,
  seleccionadoId,
  onSeleccionar,
  onCambiarPagina,
}) {
  return (
    <>
      <div className="historial-tabla-scroll">
        <table className="historial-tabla">
          <caption>Últimos registros médicos ({total} en total)</caption>
          <thead>
            <tr>
              <th scope="col">Seleccionar</th>
              <th scope="col">Nombre</th>
              <th scope="col">Tipo de tratamiento</th>
              <th scope="col">Fecha</th>
              <th scope="col">Veterinario</th>
              <th scope="col">Insumos</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td className="historial-tabla__vacia" colSpan="6">
                  No hay registros médicos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr
                  key={registro.id_historial}
                  className={registro.id_historial === seleccionadoId ? 'is-selected' : ''}
                  onClick={() => onSeleccionar(registro.id_historial)}
                >
                  <td>
                    <input
                      type="radio"
                      name="historial-seleccionado"
                      aria-label={`Seleccionar registro ${registro.id_historial}`}
                      checked={registro.id_historial === seleccionadoId}
                      onChange={() => onSeleccionar(registro.id_historial)}
                    />
                  </td>
                  {/* El nombre viene del animal relacionado (animales.nombre_animal) */}
                  <td>{registro.animal.nombre_animal}</td>
                  <td>{registro.tratamiento}</td>
                  <td>
                    <span className="historial-tabla__fecha">
                      {formatearFecha(registro.fecha_tratamiento)}
                    </span>
                  </td>
                  <td>{registro.veterinario}</td>
                  <td className="historial-tabla__insumos">{textoInsumos(registro.insumos)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* La paginación solo aparece si hay más de una página */}
      {totalPaginas > 1 && (
        <nav className="historial-paginacion" aria-label="Páginas del historial">
          <button
            type="button"
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina === 1}
          >
            Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina === totalPaginas}
          >
            Siguiente
          </button>
        </nav>
      )}
    </>
  )
}