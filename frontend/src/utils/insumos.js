// Funciones para mostrar los insumos del inventario

// nombre que se muestra de cada insumo. La tabla Insumo no tiene una columna "nombre",
// así que se usa la descripción (que es lo más específico) y, si no tiene, el tipo.
export function nombreInsumo(insumo) {
  return insumo.descripcion || insumo.tipo_insumo
}

// cantidad con su unidad de medida, por ejemplo "3 kg", "500 g", "1 unidad" o "4 unidades".
// unidad_medida puede ser 'kg', 'g' o 'unidad' (ver insumos.schema.js del backend).
export function cantidadConUnidad(cantidad, unidadMedida) {
  if (unidadMedida === 'kg' || unidadMedida === 'g') return `${cantidad} ${unidadMedida}`
  return `${cantidad} ${Number(cantidad) === 1 ? 'unidad' : 'unidades'}`
}

// fecha y hora guardadas como "2026-11-26T20:51:09.381Z" -> "26-11-2026", en la hora de Chile.
// Se usa para la fecha de apertura de un envase, que es el momento exacto en que se abrió
// (no una fecha a las 00:00 UTC como las del historial, por eso no se usa formatearFecha).
function fechaLocal(valor) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(new Date(valor))
}

// Texto del estado del envase de un insumo de tipo "estado", por ejemplo
// "Cerrado", "Abierto desde 26-11-2026" o "Terminado".
// Para los insumos contables devuelve null, porque no tienen envase que seguir.
export function textoEstadoEnvase(insumo) {
  if (insumo.tipo_control !== 'estado') return null
  if (insumo.estado_envase === 'abierto') {
    return insumo.fecha_apertura ? `Abierto desde ${fechaLocal(insumo.fecha_apertura)}` : 'Abierto'
  }
  if (insumo.estado_envase === 'terminado') return 'Terminado'
  return 'Cerrado'
}