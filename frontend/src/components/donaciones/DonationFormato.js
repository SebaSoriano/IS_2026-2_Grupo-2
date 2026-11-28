export const formatoPesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

// fecha_donacion es un instante exacto: se muestra en la hora del navegador
export function formatoFechaHora(valor) {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
}

// fecha_agendada se guarda como día a las 00:00 UTC: se muestra en UTC para que no retroceda un día
export function formatoDia(valor) {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC' }).format(new Date(valor))
}

export function detalleDonacion(donacion) {
  if (donacion.tipo_donacion === 'monetaria') {
    return `${formatoPesos.format(donacion.monto_donacion)} · ${donacion.metodo_pago}`
  }
  return donacion.descripcion_insumos
}

// el donante es opcional en las presenciales: si no dejó su nombre, se muestra como anónimo
export function nombreDonante(donacion) {
  return donacion.donante_nombre || (donacion.origen === 'presencial' ? 'Anónimo' : '—')
}

// Solo se agendan las de insumos que todavía están pendientes
export const puedeAgendar = (donacion) => donacion.tipo_donacion === 'insumos' && donacion.estado === 'pendiente'

// monetarias: solo el titular de la cuenta (la Admin también, solo en sus propias cuentas)
export const puedeConfirmar = (donacion, usuario) => {
  if (donacion.estado === 'confirmada' || donacion.estado === 'rechazada') return false
  if (donacion.tipo_donacion === 'insumos') return true
  return donacion.cuenta?.rut_usuario === usuario.rut
}

// las monetarias web piden la captura de la transferencia al confirmarlas
export const requiereCaptura = (donacion) => donacion.tipo_donacion === 'monetaria' && donacion.origen === 'web'

// Solo se rechazan las monetarias pendientes, puede rechazar admin y propetario de cuenta
export const puedeRechazar = (donacion, usuario) =>
  donacion.tipo_donacion === 'monetaria' && donacion.estado === 'pendiente' && puedeConfirmar(donacion, usuario)