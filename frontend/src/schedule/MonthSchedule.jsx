import { useEffect, useState } from 'react'
import { getAsistencias } from '../services/api.js'
import { DIAS_LARGOS, diaDeHoy, lunesDe, nombreDelMes, semanasDelCalendario, turnosPorFecha } from './calendario.js'
import { rangoHoras } from './horas.js'

// vista Mes del horario: calendario de lunes a domingo con los turnos de cada dia
// los turnos del mes salen de la misma ruta que la asistencia (usuarios con sus turnos del mes)
// cambiosTurnos cambia cuando se añade, edita o borra un turno, para recargar el mes
// onVerSemana(lunes) se llama al hacer click en el numero de un dia, para abrir esa semana en la vista Semana
export default function MonthSchedule({ mes, cambiosTurnos, onVerSemana }) {
  // ultimo resultado cargado: { mes, usuarios } o { mes, error }; si es de otro mes, se esta cargando
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    let vigente = true
    getAsistencias(mes)
      .then((usuarios) => vigente && setResultado({ mes, usuarios }))
      .catch((error) => vigente && setResultado({ mes, error: error.message }))
    return () => {
      vigente = false
    }
  }, [mes, cambiosTurnos])

  if (resultado?.mes !== mes) return <p role="status">Cargando horario...</p>
  if (resultado.error) {
    return (
      <p className="inventory-error" role="alert">
        No se pudo cargar el horario: {resultado.error}
      </p>
    )
  }

  const hoy = diaDeHoy()
  const porFecha = turnosPorFecha(resultado.usuarios)

  return (
    <div className="schedule-table-scroll">
      <table className="schedule-month">
        <caption className="visually-hidden">Horario mensual de turnos de {nombreDelMes(mes)}</caption>
        <thead>
          <tr>
            {DIAS_LARGOS.map((dia) => <th scope="col" key={dia}>{dia}</th>)}
          </tr>
        </thead>
        <tbody>
          {semanasDelCalendario(mes).map((semana) => {
            const primerDia = semana.find(Boolean)
            return (
              <tr key={primerDia.fecha}>
                {semana.map((dia, i) => {
                  if (!dia) return <td key={`vacia-${i}`} className="is-fuera-de-mes" />
                  const turnos = porFecha.get(dia.fecha) ?? []
                  const clases = [
                    turnos.length > 0 && 'has-turno',
                    dia.fecha < hoy && 'is-pasado',
                    dia.fecha === hoy && 'is-hoy',
                  ].filter(Boolean).join(' ')
                  return (
                    <td key={dia.fecha} className={clases || undefined}>
                      <button
                        type="button"
                        className="schedule-month__dia"
                        onClick={() => onVerSemana(lunesDe(dia.fecha))}
                        title="Ver esta semana"
                        aria-label={`${DIAS_LARGOS[dia.diaSemana - 1]} ${dia.numero}: ver esta semana`}
                      >
                        {dia.numero}
                      </button>
                      {turnos.map((turno) => (
                        <span className="schedule-month__turno" key={turno.id}>
                          <strong>{rangoHoras(turno)}</strong> {turno.nombre}
                        </span>
                      ))}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
