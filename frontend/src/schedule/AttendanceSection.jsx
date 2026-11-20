import { useCallback, useEffect, useState } from 'react'
import { getAsistencias, marcarAsistenciaTurno } from '../services/api.js'
import Modal from './Modal.jsx'
import { usePermisos } from '../sesion/sesion.js'
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

// el estado de cada turno lo calcula el backend con hora_llegada:
// 'a-tiempo' (hasta 25 min despues del inicio), 'tarde', 'ausente' (termino sin llegada) o 'pendiente' (aun no termina)
const CLASE_POR_ESTADO = {
  'a-tiempo': 'is-presente',
  tarde: 'is-tarde',
  ausente: 'is-ausente',
  pendiente: 'is-turno',
}

const describirEstado = (turno) =>
  ({
    'a-tiempo': `Llegó a la hora (${turno.hora_llegada})`,
    tarde: `Llegó tarde (${turno.hora_llegada})`,
    ausente: 'No registró llegada',
    pendiente: 'Aún sin llegada',
  })[turno.estado]

// clase de la celda cuando la persona tiene 2 o mas turnos ese dia
const claseDelDia = (turnos) => {
  const llegadas = turnos.filter((turno) => turno.hora_llegada)
  if (llegadas.length === turnos.length) {
    return llegadas.every((turno) => turno.estado === 'a-tiempo') ? 'is-presente' : 'is-tarde'
  }
  if (llegadas.length > 0) return 'is-parcial'
  return turnos.some((turno) => turno.estado === 'ausente') ? 'is-ausente' : 'is-turno'
}

// tabla de asistencia del mes elegido: mes, luego semanas y debajo los dias
// a la izquierda el staff; en cada dia se ven sus turnos de esa fecha:
//  - con 1 turno: el color dice si llego a la hora, tarde o no vino; solo el Admin puede corregirlo con un click
//  - con 2 o mas: muestra a/b (turnos con llegada / turnos del dia) y el click abre un pop-up para corregir cada uno
// la llegada la registra cada persona con el boton "Llegué" del horario
// cambiosTurnos cambia cuando se añade, edita o borra un turno, para recargar la tabla
export default function AttendanceSection({ cambiosTurnos }) {
  // solo el Admin corrige la asistencia; Veterinaria y Voluntario la ven sin botón en las celdas
  const { puedeCorregirAsistencia } = usePermisos()
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

  // correccion manual: si el turno tiene llegada la borra, si no la deja como llegada a la hora
  // actualiza solo ese turno en la tabla
  const alternarTurno = async (turno) => {
    setGuardando((ids) => [...ids, turno.id])
    setError('')
    try {
      const actualizado = await marcarAsistenciaTurno(turno.id, !turno.hora_llegada)
      setUsuarios((actuales) =>
        actuales.map((usuario) => ({
          ...usuario,
          turnos: usuario.turnos.map((t) =>
            t.id === turno.id ? { ...t, hora_llegada: actualizado.hora_llegada, estado: actualizado.estado } : t,
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

      {/* bloque 1: RUT y Nombre, fijo a la izquierda y fuera del scroll */}
      {/* bloque 2: mes fijo y centrado; debajo, lo único con scroll horizontal son las semanas y días */}
      {/* son dos tablas separadas: las filas se alinean con alturas fijas (variables --asistencia-* en el CSS) */}
      <div className="attendance-grid">
        <table className="attendance-table attendance-staff">
          <caption className="visually-hidden">Staff de la asistencia</caption>
          <thead>
            <tr>
              <th scope="col" className="attendance-table__rut">RUT</th>
              <th scope="col" className="attendance-table__nombre">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {estado === 'success' &&
              usuarios.map((usuario) => (
                <tr key={usuario.rut_usuario}>
                  <td className="attendance-table__rut">{usuario.rut_usuario}</td>
                  <th scope="row" className="attendance-table__nombre">{usuario.nombre_usuario}</th>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="attendance-dias">
          <div className="attendance-mes">
            <div className="month-picker">
              <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button>
              <span aria-live="polite">{nombreDelMes(mes)}</span>
              <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button>
            </div>
          </div>

          <div className="attendance-table-scroll">
            <table className="attendance-table">
              <caption className="visually-hidden">Asistencia de {nombreDelMes(mes)}</caption>
              <thead>
                <tr className="attendance-table__fila-semana">
                  {semanas.map((semana, i) => (
                    <th scope="colgroup" colSpan={semana.length} className="attendance-table__semana" key={semana[0].fecha}>
                      Semana {i + 1}
                    </th>
                  ))}
                </tr>
                <tr className="attendance-table__fila-dia">
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
                        {dias.map((dia) => (
                          <CeldaAsistencia
                            key={dia.fecha}
                            dia={dia}
                            turnos={turnosPorDia.get(dia.fecha) ?? []}
                            esFuturo={dia.fecha > hoy}
                            guardando={guardando}
                            nombre={usuario.nombre_usuario}
                            soloLectura={!puedeCorregirAsistencia}
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
        </div>
      </div>

      {/* fuera de las tablas para no descuadrar las filas de ambos bloques */}
      {estado === 'loading' && (
        <p className="attendance-table__mensaje" role="status">Cargando asistencia...</p>
      )}
      {estado === 'success' && usuarios.length === 0 && (
        <p className="attendance-table__mensaje">No hay staff registrado.</p>
      )}

      <ul className="attendance-legend" aria-label="Simbología">
        <li><span className="attendance-legend__muestra is-presente">✓</span> Llegó a la hora</li>
        <li><span className="attendance-legend__muestra is-tarde">✓</span> Llegó tarde (más de 25 min)</li>
        <li><span className="attendance-legend__muestra is-ausente" /> No registró llegada</li>
        <li><span className="attendance-legend__muestra is-parcial">a/b</span> Registró llegada en <em>a</em> de sus <em>b</em> turnos del día (cuando tiene 2 o más)</li>
        <li><span className="attendance-legend__muestra is-turno" /> {puedeCorregirAsistencia ? 'Turno aún sin llegada (click para corregir)' : 'Turno aún sin llegada'}</li>
        <li><span className="attendance-legend__muestra is-sin-turno" /> Sin turno</li>
      </ul>

      {diaAbierto && (
        <Modal
          title={`${diaAbierto.nombre} · ${DIAS_CORTOS[diaAbierto.dia.diaSemana - 1]} ${diaAbierto.dia.numero}`}
          onClose={() => setDiaAbierto(null)}
        >
          <div className="turno-form">
            <p>Marca los turnos a los que llegó. Desmarcar borra la llegada registrada:</p>
            <ul className="attendance-turnos">
              {turnosDelDiaAbierto.map((turno) => (
                <li key={turno.id}>
                  <label className={CLASE_POR_ESTADO[turno.estado]}>
                    {/* no se deshabilita mientras guarda para no perder el foco; el click repetido se ignora */}
                    <input
                      type="checkbox"
                      checked={Boolean(turno.hora_llegada)}
                      onChange={() => !guardando.includes(turno.id) && alternarTurno(turno)}
                      aria-busy={guardando.includes(turno.id)}
                    />
                    {describirHoras(turno)} · {describirEstado(turno)}
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

// una celda por usuario y dia: solo se puede corregir en dias con turno de hoy o anteriores
// con soloLectura (Veterinaria y Voluntario) se muestra el mismo color y contenido, pero sin botón para hacer click
function CeldaAsistencia({ dia, turnos, esFuturo, guardando, nombre, soloLectura, onAlternar, onAbrir }) {
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

  // con un solo turno el click corrige directo: borra la llegada o la deja como llegada a la hora
  if (turnos.length === 1) {
    const [turno] = turnos
    const clase = `attendance-cell ${CLASE_POR_ESTADO[turno.estado]}${inicioSemana}`
    const estado = `Turno ${describirHoras(turno)}: ${describirEstado(turno)}`
    const marca = turno.hora_llegada ? '✓' : ''
    if (soloLectura) {
      return <td className={clase} title={estado}>{marca}</td>
    }
    return (
      <td className={clase}>
        <button
          type="button"
          onClick={() => onAlternar(turno)}
          disabled={guardando.includes(turno.id)}
          aria-label={`${descripcion}, ${estado}. ${turno.hora_llegada ? 'Click para borrar la llegada' : 'Click para marcar que llegó a la hora'}`}
          title={`${estado} (${turno.hora_llegada ? 'click para borrar la llegada' : 'click para marcar que llegó a la hora'})`}
        >
          {marca}
        </button>
      </td>
    )
  }

  // con 2 o mas turnos se muestra a/b y el click abre el pop-up del dia
  const llegadas = turnos.filter((turno) => turno.hora_llegada).length
  const clase = `attendance-cell ${claseDelDia(turnos)}${inicioSemana}`
  const resumen = `Registró llegada en ${llegadas} de ${turnos.length} turnos`
  if (soloLectura) {
    return (
      <td className={clase} title={resumen}>
        <span className="attendance-cell__conteo">{llegadas}/{turnos.length}</span>
      </td>
    )
  }
  return (
    <td className={clase}>
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`${descripcion}: ${resumen.toLowerCase()}. Click para corregir`}
        title={`${resumen} (click para corregir)`}
      >
        <span className="attendance-cell__conteo">{llegadas}/{turnos.length}</span>
      </button>
    </td>
  )
}