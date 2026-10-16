import { useCallback, useEffect, useState } from 'react'
import { desmarcarAsistencia, getAsistencias, marcarAsistencia } from '../services/api.js'
import {
  DIAS_CORTOS,
  diaDeHoy,
  diasDelMes,
  mesActual,
  moverMes,
  nombreDelMes,
  semanasDelMes,
} from './calendario.js'

// tabla de asistencia del mes elegido: mes, luego semanas y debajo los dias
// a la izquierda el staff; un click en un dia con turno marca que llego a la hora (verde con tick)
// cambiosTurnos cambia cuando se añade, edita o borra un turno, para recargar los dias con turno
export default function AttendanceSection({ cambiosTurnos }) {
  const [mes, setMes] = useState(mesActual)
  const [usuarios, setUsuarios] = useState([])
  const [estado, setEstado] = useState('loading')
  const [error, setError] = useState('')
  // celda que se esta guardando ("rut|fecha") para no permitir doble click
  const [guardando, setGuardando] = useState(null)

  const cargarAsistencia = useCallback(() => {
    return getAsistencias(mes)
      .then((data) => {
        setUsuarios(data)
        setEstado('success')
      })
      .catch((err) => {
        setError(err.message)
        setEstado('error')
      })
  }, [mes])

  useEffect(() => {
    cargarAsistencia()
  }, [cargarAsistencia, cambiosTurnos])

  const cambiarMes = (cantidad) => {
    setEstado('loading')
    setError('')
    setMes((actual) => moverMes(actual, cantidad))
  }

  const dias = diasDelMes(mes)
  const semanas = semanasDelMes(dias)
  const hoy = diaDeHoy()

  // si la celda esta marcada se desmarca, si no se marca; luego se actualiza solo ese usuario
  const alternarAsistencia = async (usuario, fecha, idMarcada) => {
    setGuardando(`${usuario.rut_usuario}|${fecha}`)
    setError('')
    try {
      let asistencias
      if (idMarcada) {
        await desmarcarAsistencia(idMarcada)
        asistencias = usuario.asistencias.filter((asistencia) => asistencia.id !== idMarcada)
      } else {
        const nueva = await marcarAsistencia(usuario.rut_usuario, fecha)
        asistencias = [...usuario.asistencias, nueva]
      }
      setUsuarios((actuales) =>
        actuales.map((u) => (u.rut_usuario === usuario.rut_usuario ? { ...u, asistencias } : u)),
      )
    } catch (err) {
      const detalles = err.details?.map((detalle) => detalle.mensaje).join('. ')
      setError(detalles || err.message)
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div className="attendance" aria-busy={estado === 'loading'}>
      {estado === 'error' && (
        <p className="inventory-error" role="alert">No se pudo cargar la asistencia: {error}</p>
      )}
      {/* error al marcar o desmarcar una celda */}
      {estado === 'success' && error && <p className="inventory-error" role="alert">{error}</p>}

      <div className="attendance-table-scroll">
        <table className="attendance-table">
          <caption className="visually-hidden">Asistencia de {nombreDelMes(mes)}</caption>
          <thead>
            <tr>
              <th scope="col" rowSpan="3" className="attendance-table__rut">RUT</th>
              <th scope="col" rowSpan="3" className="attendance-table__nombre">Nombre</th>
              <th scope="colgroup" colSpan={dias.length} className="attendance-table__mes">
                <div className="month-picker">
                  <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button>
                  <span aria-live="polite">{nombreDelMes(mes)}</span>
                  <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button>
                </div>
              </th>
            </tr>
            <tr>
              {semanas.map((semana, i) => (
                <th scope="colgroup" colSpan={semana.length} className="attendance-table__semana" key={semana[0].fecha}>
                  Semana {i + 1}
                </th>
              ))}
            </tr>
            <tr>
              {dias.map((dia) => (
                <th
                  scope="col"
                  key={dia.fecha}
                  className={`attendance-table__dia${dia.diaSemana === 1 ? ' inicio-semana' : ''}${dia.fecha === hoy ? ' is-hoy' : ''}`}
                >
                  <span>{DIAS_CORTOS[dia.diaSemana - 1]}</span>
                  <span>{dia.numero}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estado === 'loading' && (
              <tr>
                <td colSpan={dias.length + 2} className="attendance-table__mensaje" role="status">
                  Cargando asistencia...
                </td>
              </tr>
            )}
            {estado === 'success' && usuarios.length === 0 && (
              <tr>
                <td colSpan={dias.length + 2} className="attendance-table__mensaje">No hay staff registrado.</td>
              </tr>
            )}
            {estado === 'success' &&
              usuarios.map((usuario) => {
                // fecha ("AAAA-MM-DD") -> id de la asistencia marcada ese dia
                const marcadas = new Map(
                  usuario.asistencias.map((asistencia) => [asistencia.fecha.slice(0, 10), asistencia.id]),
                )
                return (
                  <tr key={usuario.rut_usuario}>
                    <td className="attendance-table__rut">{usuario.rut_usuario}</td>
                    <th scope="row" className="attendance-table__nombre">{usuario.nombre_usuario}</th>
                    {dias.map((dia) => (
                      <CeldaAsistencia
                        key={dia.fecha}
                        dia={dia}
                        idMarcada={marcadas.get(dia.fecha)}
                        tieneTurno={usuario.dias_turno.includes(dia.diaSemana)}
                        esFuturo={dia.fecha > hoy}
                        guardando={guardando === `${usuario.rut_usuario}|${dia.fecha}`}
                        nombre={usuario.nombre_usuario}
                        onClick={(idMarcada) => alternarAsistencia(usuario, dia.fecha, idMarcada)}
                      />
                    ))}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <ul className="attendance-legend" aria-label="Simbología">
        <li><span className="attendance-legend__muestra is-presente">✓</span> Llegó a la hora</li>
        <li><span className="attendance-legend__muestra is-turno" /> Tiene turno (click para marcar)</li>
        <li><span className="attendance-legend__muestra is-sin-turno" /> Sin turno</li>
      </ul>
    </div>
  )
}

// una celda por usuario y dia: solo se puede marcar en dias con turno que ya pasaron
function CeldaAsistencia({ dia, idMarcada, tieneTurno, esFuturo, guardando, nombre, onClick }) {
  const inicioSemana = dia.diaSemana === 1 ? ' inicio-semana' : ''
  const descripcion = `${nombre}, ${DIAS_CORTOS[dia.diaSemana - 1]} ${dia.numero}`

  // una asistencia ya marcada siempre se puede desmarcar, aunque luego se haya borrado el turno
  if (idMarcada) {
    return (
      <td className={`attendance-cell is-presente${inicioSemana}`}>
        <button
          type="button"
          onClick={() => onClick(idMarcada)}
          disabled={guardando}
          aria-label={`${descripcion}: llegó a la hora. Click para desmarcar`}
          title="Llegó a la hora (click para desmarcar)"
        >
          ✓
        </button>
      </td>
    )
  }

  if (tieneTurno && !esFuturo) {
    return (
      <td className={`attendance-cell is-turno${inicioSemana}`}>
        <button
          type="button"
          onClick={() => onClick(null)}
          disabled={guardando}
          aria-label={`${descripcion}: marcar que llegó a la hora`}
          title="Marcar que llegó a la hora"
        />
      </td>
    )
  }

  return (
    <td
      className={`attendance-cell ${tieneTurno ? 'is-turno-futuro' : 'is-sin-turno'}${inicioSemana}`}
      title={tieneTurno ? 'Día que aún no pasa' : 'Sin turno este día'}
    />
  )
}
