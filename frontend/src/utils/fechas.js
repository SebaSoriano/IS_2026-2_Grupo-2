// el backend guarda y entrega las fechas en formato ISO ("2025-03-06T00:00:00.000Z")

// agrega un cero a la izquierda cuando el número tiene un solo dígito: 6 -> "06"
const dosDigitos = (numero) => String(numero).padStart(2, '0')

// Se usan los métodos getUTC porque el backend guarda las fechas a las 00:00 UTC
export function formatearFecha(valor) {
  if (!valor) return ''
  const fecha = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  return `${dosDigitos(fecha.getUTCDate())}-${dosDigitos(fecha.getUTCMonth() + 1)}-${fecha.getUTCFullYear()}`
}

// Pasa una fecha ISO corta "2025-03-06" a "06-03-2025"
export function isoATexto(iso) {
  if (!iso) return ''
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}-${mes}-${anio}`
}

// Pasa un texto "06-03-2025" a "2025-03-06", que es lo que espera el backend.
// Si el texto está incompleto o la fecha no existe (por ejemplo 31-02-2025) devuelve null.
export function textoAIso(texto) {
  const partes = /^(\d{2})-(\d{2})-(\d{4})$/.exec(texto ?? '')
  if (!partes) return null

  const [, dia, mes, anio] = partes
  // Date.UTC "corrige" las fechas que no existen: el 31-02 lo convierte en el 03-03.
  // Por eso se arma la fecha y se revisa que el día y el mes sigan siendo los mismos.
  const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)))
  if (fecha.getUTCDate() !== Number(dia) || fecha.getUTCMonth() !== Number(mes) - 1) return null

  return `${anio}-${mes}-${dia}`
}

// Las fechas llegan al backend con el formato ISO "AAAA-MM-DD"
// el formato canadiense funciona justo así, así que lo dejamos
// de esta forma es más fácil validar fechas
export const hoyIso = () => new Date().toLocaleDateString('en-CA')