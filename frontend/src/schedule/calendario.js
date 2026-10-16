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
