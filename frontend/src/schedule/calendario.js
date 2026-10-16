// helpers para la tabla de asistencia: el mes se maneja como texto "AAAA-MM" y cada dia como "AAAA-MM-DD"

export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// abreviaturas en el mismo orden que el id del horario (1 = Lunes ... 7 = Domingo)
export const DIAS_CORTOS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']

const dosDigitos = (n) => String(n).padStart(2, '0')

// mes del sistema, ej: "2026-10"; por defecto la tabla parte en este mes
export function mesActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}`
}

// dia de hoy del sistema, ej: "2026-10-15"; los dias despues de hoy no se pueden marcar
export function diaDeHoy() {
  const hoy = new Date()
  return `${mesActual()}-${dosDigitos(hoy.getDate())}`
}

// avanza o retrocede meses, ej: moverMes("2026-12", 1) -> "2027-01"
export function moverMes(mes, cantidad) {
  const [anio, numeroMes] = mes.split('-').map(Number)
  const fecha = new Date(anio, numeroMes - 1 + cantidad, 1)
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}`
}

// "2026-10" -> "Octubre 2026"
export function nombreDelMes(mes) {
  const [anio, numeroMes] = mes.split('-').map(Number)
  return `${NOMBRES_MESES[numeroMes - 1]} ${anio}`
}

// todos los dias del mes con su numero y su dia de la semana (1 = Lunes ... 7 = Domingo)
export function diasDelMes(mes) {
  const [anio, numeroMes] = mes.split('-').map(Number)
  const cantidad = new Date(anio, numeroMes, 0).getDate()

  return Array.from({ length: cantidad }, (_, i) => {
    const numero = i + 1
    // getDay devuelve 0 para el domingo, por eso se cambia a 7
    const diaSemana = new Date(anio, numeroMes - 1, numero).getDay() || 7
    return { fecha: `${mes}-${dosDigitos(numero)}`, numero, diaSemana }
  })
}

// agrupa los dias en semanas de lunes a domingo; la primera y la ultima pueden quedar incompletas
export function semanasDelMes(dias) {
  const semanas = []
  for (const dia of dias) {
    if (semanas.length === 0 || dia.diaSemana === 1) semanas.push([])
    semanas[semanas.length - 1].push(dia)
  }
  return semanas
}

// ---------- semanas (de lunes a domingo); una semana se identifica por la fecha de su lunes ----------

const NOMBRES_MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// "2026-10-15" -> Date local de ese dia
const fechaLocal = (texto) => {
  const [anio, mes, dia] = texto.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

// Date local -> "2026-10-15"
const textoDeFecha = (fecha) =>
  `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`

// suma (o resta) dias a una fecha, ej: sumarDias("2026-10-31", 1) -> "2026-11-01"
export function sumarDias(texto, dias) {
  const fecha = fechaLocal(texto)
  fecha.setDate(fecha.getDate() + dias)
  return textoDeFecha(fecha)
}

// lunes de la semana de una fecha, ej: lunesDe("2026-10-15") -> "2026-10-12"
export function lunesDe(texto) {
  const diaSemana = fechaLocal(texto).getDay() || 7
  return sumarDias(texto, 1 - diaSemana)
}

// lunes de la semana actual del sistema; por defecto el horario y el pop-up de turnos parten en esta semana
export const semanaActual = () => lunesDe(diaDeHoy())

// fecha de un dia de la semana (1 = Lunes ... 7 = Domingo) a partir del lunes de esa semana
export const fechaDelDia = (lunes, diaSemana) => sumarDias(lunes, diaSemana - 1)

// "2026-10-12" -> "Semana 3 de octubre · 12 al 18"
// el numero de semana se cuenta dentro del mes del lunes, igual que en la tabla de asistencia
// si la semana cruza de mes se muestran los dos, ej: "Semana 5 de septiembre · 28 sep al 4 oct"
export function describirSemana(lunes) {
  const domingo = sumarDias(lunes, 6)
  const mes = lunes.slice(0, 7)
  const numero = semanasDelMes(diasDelMes(mes)).findIndex((semana) => semana.some((dia) => dia.fecha === lunes)) + 1
  const nombreMes = NOMBRES_MESES[Number(mes.slice(5)) - 1].toLowerCase()

  const [diaLunes, diaDomingo] = [Number(lunes.slice(8)), Number(domingo.slice(8))]
  const rango = domingo.slice(0, 7) === mes
    ? `${diaLunes} al ${diaDomingo}`
    : `${diaLunes} ${NOMBRES_MESES_CORTOS[Number(mes.slice(5)) - 1]} al ${diaDomingo} ${NOMBRES_MESES_CORTOS[Number(domingo.slice(5, 7)) - 1]}`

  return `Semana ${numero} de ${nombreMes} · ${rango}`
}
