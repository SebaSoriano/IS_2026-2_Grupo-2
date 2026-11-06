import { useCallback, useEffect, useState } from 'react'
import { getAsistencias, marcarAsistenciaTurno } from '../services/api.js'
import Modal from './Modal.jsx'
import {
  DIAS_CORTOS,
  diaDeHoy,
  diasDelMes,
  mesActual,
  moverMes,
  nombreDelMes,
  semanasDelMes,
} from './calendario.js'

// "08:00" a "10:00", o solo la llegada si no tiene hora de ida
const describirHoras = (turno) =>
  turno.hora_fin ? `${turno.hora_inicio} a ${turno.hora_fin}` : `${turno.hora_inicio} (sin hora de ida)`

// tabla de asistencia del mes elegido: mes, luego semanas y debajo los dias
// a la izquierda el staff; en cada dia se ven sus turnos de esa fecha:
//  - con 1 turno: un click marca que llego a la hora (verde con tick)
//  - con 2 o mas: muestra a/b (turnos con llegada a la hora / turnos del dia) y el click abre un pop-up para marcar cada uno
// cambiosTurnos cambia cuando se añade, edita o borra un turno, para recargar la tabla
export default function AttendanceSection({ cambiosTurnos }) {
  const [mes, setMes] = useState(mesActual)
  const [usuarios, setUsuarios] = useState([])
  const [estado, setEstado] = useState('loading')
  const [error, setError] = useState('')
  // turnos que se estan guardando (ids) para no permitir doble click
  const [guardando, setGuardando] = useState([])
  // dia abierto en el pop-up: { rut, nombre, dia }
  const [diaAbierto, setDiaAbierto] = useState(null)

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

  // marca o desmarca un turno y actualiza solo ese turno en la tabla
  const alternarTurno = async (turno) => {
    setGuardando((ids) => [...ids, turno.id])
    setError('')
    try {
      const actualizado = await marcarAsistenciaTurno(turno.id, !turno.llego_a_la_hora)
      setUsuarios((actuales) =>
        actuales.map((usuario) => ({
          ...usuario,
          turnos: usuario.turnos.map((t) =>
            t.id === turno.id ? { ...t, llego_a_la_hora: actualizado.llego_a_la_hora } : t,
          ),
        })),
      )
    } catch (err) {
      const detalles = err.details?.map((detalle) => detalle.mensaje).join('. ')
      setError(detalles || err.message)
    } finally {
      setGuardando((ids) => ids.filter((id) => id !== turno.id))
    }
  }

  // turnos del dia abierto en el pop-up, se leen de la tabla para que se vean los cambios al marcar
  const turnosDelDiaAbierto = diaAbierto
    ? usuarios
        .find((usuario) => usuario.rut_usuario === diaAbierto.rut)
        ?.turnos.filter((turno) => turno.fecha.slice(0, 10) === diaAbierto.dia.fecha) ?? []
    : []

  return (
    <div className="attendance" aria-busy={estado === 'loading'}>
      {estado === 'error' && (
        <p className="inventory-error" role="alert">No se pudo cargar la asistencia: {error}</p>
      )}
      {/* error al marcar o desmarcar un turno */}
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
                // fecha ("AAAA-MM-DD") -> turnos de ese dia
                const turnosPorDia = new Map()
                for (const turno of usuario.turnos) {
                  const fecha = turno.fecha.slice(0, 10)
                  turnosPorDia.set(fecha, [...(turnosPorDia.get(fecha) ?? []), turno])
                }
                return (
                  <tr key={usuario.rut_usuario}>
                    <td className="attendance-table__rut">{usuario.rut_usuario}</td>
                    <th scope="row" className="attendance-table__nombre">{usuario.nombre_usuario}</th>
                    {dias.map((dia) => (
                      <CeldaAsistencia
                        key={dia.fecha}
                        dia={dia}
                        turnos={turnosPorDia.get(dia.fecha) ?? []}
                        esFuturo={dia.fecha > hoy}
                        guardando={guardando}
                        nombre={usuario.nombre_usuario}
                        onAlternar={alternarTurno}
                        onAbrir={() => setDiaAbierto({ rut: usuario.rut_usuario, nombre: usuario.nombre_usuario, dia })}
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
        <li><span className="attendance-legend__muestra is-parcial">a/b</span> Llegó a la hora, <em>a</em> de sus <em>b</em> turnos del día (cuando tiene 2 o más)</li>
        <li><span className="attendance-legend__muestra is-turno" /> Tiene turno (click para marcar)</li>
        <li><span className="attendance-legend__muestra is-sin-turno" /> Sin turno</li>
      </ul>

      {diaAbierto && (
        <Modal
          title={`${diaAbierto.nombre} · ${DIAS_CORTOS[diaAbierto.dia.diaSemana - 1]} ${diaAbierto.dia.numero}`}
          onClose={() => setDiaAbierto(null)}
        >
          <div className="turno-form">
            <p>Marca los turnos a los que llegó a la hora:</p>
            <ul className="attendance-turnos">
              {turnosDelDiaAbierto.map((turno) => (
                <li key={turno.id}>
                  <label className={turno.llego_a_la_hora ? 'is-presente' : undefined}>
                    {/* no se deshabilita mientras guarda para no perder el foco; el click repetido se ignora */}
                    <input
                      type="checkbox"
                      checked={turno.llego_a_la_hora}
                      onChange={() => !guardando.includes(turno.id) && alternarTurno(turno)}
                      aria-busy={guardando.includes(turno.id)}
                    />
                    {describirHoras(turno)}
                  </label>
                </li>
              ))}
            </ul>
            {error && <p className="turno-form__error" role="alert">{error}</p>}
            <div className="modal__actions">
              <button type="button" className="modal__button modal__button--primary" onClick={() => setDiaAbierto(null)}>
                Listo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// una celda por usuario y dia: solo se puede marcar en dias con turno de hoy o anteriores
function CeldaAsistencia({ dia, turnos, esFuturo, guardando, nombre, onAlternar, onAbrir }) {
  const inicioSemana = dia.diaSemana === 1 ? ' inicio-semana' : ''
  const descripcion = `${nombre}, ${DIAS_CORTOS[dia.diaSemana - 1]} ${dia.numero}`

  if (turnos.length === 0) {
    return <td className={`attendance-cell is-sin-turno${inicioSemana}`} title="Sin turno este día" />
  }

  if (esFuturo) {
    return (
      <td className={`attendance-cell is-turno-futuro${inicioSemana}`} title="Día que aún no llega">
        {turnos.length > 1 && <span className="attendance-cell__conteo">0/{turnos.length}</span>}
      </td>
    )
  }

  // con un solo turno el click marca o desmarca directo
  if (turnos.length === 1) {
    const [turno] = turnos
    return (
      <td className={`attendance-cell ${turno.llego_a_la_hora ? 'is-presente' : 'is-turno'}${inicioSemana}`}>
        <button
          type="button"
          onClick={() => onAlternar(turno)}
          disabled={guardando.includes(turno.id)}
          aria-label={`${descripcion}, ${describirHoras(turno)}: ${turno.llego_a_la_hora ? 'llegó a la hora. Click para desmarcar' : 'marcar que llegó a la hora'}`}
          title={turno.llego_a_la_hora ? 'Llegó a la hora (click para desmarcar)' : `Turno ${describirHoras(turno)}: click para marcar`}
        >
          {turno.llego_a_la_hora ? '✓' : ''}
        </button>
      </td>
    )
  }

  // con 2 o mas turnos se muestra a/b y el click abre el pop-up del dia
  const presentes = turnos.filter((turno) => turno.llego_a_la_hora).length
  const clase = presentes === turnos.length ? 'is-presente' : presentes > 0 ? 'is-parcial' : 'is-turno'
  return (
    <td className={`attendance-cell ${clase}${inicioSemana}`}>
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`${descripcion}: llegó a la hora a ${presentes} de ${turnos.length} turnos. Click para marcar`}
        title={`Llegó a la hora a ${presentes} de ${turnos.length} turnos (click para marcar)`}
      >
        <span className="attendance-cell__conteo">{presentes}/{turnos.length}</span>
      </button>
    </td>
  )
}
