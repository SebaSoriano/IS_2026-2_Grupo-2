import { describirSemana, diaDeHoy, diasDelMes, nombreDelMes, semanasDelMes, sumarDias } from './calendario.js'
import { bloquesDelDia, formatearHora, horasDelTurno } from './horas.js'

// hoja que se imprime al exportar; en pantalla no se ve (ver .hoja-impresion en Schedule.css)
// tipo: 'horario-semanal' (datos = respuesta de getHorarios)
//       'horario-mensual' o 'asistencia-semanal' (datos = usuarios con sus turnos, de getAsistencias)

const DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const TITULOS = {
  'horario-semanal': 'Horario semanal',
  'horario-mensual': 'Horario mensual',
  'asistencia-semanal': 'Asistencia semanal',
}

// "08:00" a "12:00" -> "08:00–12:00"; sin hora de ida queda solo la llegada
const rangoHoras = (turno) =>
  turno.hora_fin ? `${turno.hora_inicio.slice(0, 5)}–${turno.hora_fin.slice(0, 5)}` : turno.hora_inicio.slice(0, 5)

const porHoraDeInicio = (a, b) => a.hora_inicio.localeCompare(b.hora_inicio)

export default function HojaImpresion({ tipo, semana, mes, datos }) {
  const periodo = tipo === 'horario-mensual' ? nombreDelMes(mes) : describirSemana(semana)
  const fechaImpresion = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="hoja-impresion">
      {/* solo mientras esta hoja existe la impresion sale en A4 horizontal */}
      <style>{'@page { size: A4 landscape; margin: 10mm; }'}</style>

      <header className="hoja-impresion__header">
        <h1>{TITULOS[tipo]}</h1>
        <p>{periodo}</p>
      </header>

      {tipo === 'horario-semanal' && <HorarioSemanal horarios={datos} />}
      {tipo === 'horario-mensual' && <HorarioMensual usuarios={datos} mes={mes} />}
      {tipo === 'asistencia-semanal' && <AsistenciaSemanal usuarios={datos} semana={semana} />}

      <footer className="hoja-impresion__pie">Impreso el {fechaImpresion}</footer>
    </div>
  )
}

// misma grilla que la tabla de la pantalla: una fila por bloque de una hora y una columna por dia
function HorarioSemanal({ horarios }) {
  const ocupacion = horarios.map((horario) => {
    const porHora = {}
    for (const turno of horario.turnos) {
      for (const h of horasDelTurno(turno)) porHora[h] = [...(porHora[h] ?? []), turno]
    }
    return porHora
  })

  return (
    <table className="hoja-tabla hoja-tabla--semanal">
      <thead>
        <tr>
          <th scope="col" className="hoja-tabla__hora">Hora</th>
          {horarios.map((horario) => (
            <th scope="col" key={horario.id}>
              {horario.dia} <span className="hoja-tabla__numero">{Number(horario.fecha.slice(8, 10))}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bloquesDelDia.map((h) => (
          <tr key={h}>
            <th scope="row" className="hoja-tabla__hora">
              {formatearHora(h)}–{formatearHora(h + 1)}
            </th>
            {horarios.map((horario, i) => {
              const turnos = ocupacion[i][h] ?? []
              return (
                <td key={horario.id} className={turnos.length > 0 ? 'has-turno' : undefined}>
                  {turnos.map((turno) => (
                    <span className="hoja-tabla__nombre" key={turno.id}>{turno.usuario.nombre_usuario}</span>
                  ))}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// calendario del mes (lunes a domingo); en cada dia sus turnos ordenados por hora de llegada
function HorarioMensual({ usuarios, mes }) {
  const turnosPorFecha = new Map()
  for (const usuario of usuarios) {
    for (const turno of usuario.turnos) {
      const fecha = turno.fecha.slice(0, 10)
      turnosPorFecha.set(fecha, [...(turnosPorFecha.get(fecha) ?? []), { ...turno, nombre: usuario.nombre_usuario }])
    }
  }

  const semanas = semanasDelMes(diasDelMes(mes))

  return (
    <table className="hoja-tabla hoja-tabla--mensual">
      <thead>
        <tr>
          {DIAS_LARGOS.map((dia) => <th scope="col" key={dia}>{dia}</th>)}
        </tr>
      </thead>
      <tbody>
        {semanas.map((dias, i) => {
          // la primera semana se rellena al inicio y la ultima al final para que cada dia quede en su columna
          const vaciasAntes = i === 0 ? dias[0].diaSemana - 1 : 0
          const vaciasDespues = 7 - vaciasAntes - dias.length
          return (
            <tr key={dias[0].fecha}>
              {Array.from({ length: vaciasAntes }, (_, j) => <td key={`antes-${j}`} className="is-fuera-de-mes" />)}
              {dias.map((dia) => {
                const turnos = (turnosPorFecha.get(dia.fecha) ?? []).sort(porHoraDeInicio)
                return (
                  <td key={dia.fecha} className={turnos.length > 0 ? 'has-turno' : undefined}>
                    <span className="hoja-tabla__dia">{dia.numero}</span>
                    {turnos.map((turno) => (
                      <span className="hoja-tabla__turno" key={turno.id}>
                        <strong>{rangoHoras(turno)}</strong> {turno.nombre}
                      </span>
                    ))}
                  </td>
                )
              })}
              {Array.from({ length: vaciasDespues }, (_, j) => <td key={`despues-${j}`} className="is-fuera-de-mes" />)}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// staff con turnos en la semana; en cada dia sus turnos con ✓ (llego a la hora), ✗ (no marcado) o sin marca si aun no llega
function AsistenciaSemanal({ usuarios, semana }) {
  const hoy = diaDeHoy()
  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(semana, i))

  const filas = usuarios
    .map((usuario) => {
      const turnos = usuario.turnos.filter((turno) => fechas.includes(turno.fecha.slice(0, 10)))
      const pasados = turnos.filter((turno) => turno.fecha.slice(0, 10) <= hoy)
      return {
        ...usuario,
        turnos,
        total: pasados.length,
        presentes: pasados.filter((turno) => turno.llego_a_la_hora).length,
      }
    })
    .filter((usuario) => usuario.turnos.length > 0)

  if (filas.length === 0) {
    return <p className="hoja-impresion__vacio">No hay turnos registrados en esta semana.</p>
  }

  return (
    <>
      <table className="hoja-tabla hoja-tabla--asistencia">
        <thead>
          <tr>
            <th scope="col" className="hoja-tabla__persona">Nombre</th>
            {fechas.map((fecha, i) => (
              <th scope="col" key={fecha}>
                {DIAS_LARGOS[i]} <span className="hoja-tabla__numero">{Number(fecha.slice(8, 10))}</span>
              </th>
            ))}
            <th scope="col" className="hoja-tabla__total">A la hora</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((usuario) => (
            <tr key={usuario.rut_usuario}>
              <th scope="row" className="hoja-tabla__persona">
                {usuario.nombre_usuario}
                <small>{usuario.rut_usuario}</small>
              </th>
              {fechas.map((fecha) => {
                const turnos = usuario.turnos.filter((turno) => turno.fecha.slice(0, 10) === fecha).sort(porHoraDeInicio)
                if (turnos.length === 0) return <td key={fecha} className="is-sin-turno" />
                return (
                  <td key={fecha}>
                    {turnos.map((turno) => {
                      const estado = fecha > hoy ? 'is-futuro' : turno.llego_a_la_hora ? 'is-presente' : 'is-ausente'
                      return (
                        <span className={`hoja-tabla__marca ${estado}`} key={turno.id}>
                          {rangoHoras(turno)}
                          {estado === 'is-presente' && ' ✓'}
                          {estado === 'is-ausente' && ' ✗'}
                        </span>
                      )
                    })}
                  </td>
                )
              })}
              <td className="hoja-tabla__total">{usuario.total > 0 ? `${usuario.presentes}/${usuario.total}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="hoja-leyenda">
        <li><span className="hoja-tabla__marca is-presente">✓</span> Llegó a la hora</li>
        <li><span className="hoja-tabla__marca is-ausente">✗</span> Sin llegada a la hora registrada</li>
        <li><span className="hoja-tabla__marca is-futuro">08:00</span> Turno que aún no llega</li>
        <li><span className="hoja-leyenda__muestra" /> Sin turno</li>
      </ul>
    </>
  )
}
