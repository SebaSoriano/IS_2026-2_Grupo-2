// bloques de una hora entre las 08:00 y las 20:00 (igual que el schema de turnos del backend)
export const HORA_MIN = 8
export const HORA_MAX = 20
export const HORA_PREDETERMINADA = 12

// 8 -> "08:00"
export const formatearHora = (h) => `${String(h).padStart(2, '0')}:00`

// "08:00" -> 8
export const leerHora = (texto) => Number(texto.slice(0, 2))

export const rango = (desde, hasta) =>
  Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)

// filas de la tabla: 08:00-09:00 ... 19:00-20:00
export const bloquesDelDia = rango(HORA_MIN, HORA_MAX - 1)

// horas que cubre un turno; sin hora de ida el turno dura solo su bloque
export function horasDelTurno(turno) {
  const inicio = leerHora(turno.hora_inicio)
  const fin = turno.hora_fin ? leerHora(turno.hora_fin) : inicio + 1
  return rango(inicio, fin - 1)
}
