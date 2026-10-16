import { useCallback, useEffect, useState } from 'react'
import { scheduleActions } from '../data/scheduleActions.js'
import { actualizarTurno, crearTurno, eliminarTurno, getHorarios } from '../services/api.js'
import AttendanceSection from './AttendanceSection.jsx'
import Modal from './Modal.jsx'
import TurnoForm from './TurnoForm.jsx'
import TurnoSelector from './TurnoSelector.jsx'
import WeekPicker from './WeekPicker.jsx'
import { diaDeHoy, lunesDe, semanaActual } from './calendario.js'
import { bloquesDelDia, formatearHora, horasDelTurno } from './horas.js'

// estas acciones abren un pop-up; Asistencia cambia la vista y Exportar queda pendiente
const MODAL_POR_ACCION = {
  'Añadir turno': 'crear',
  'Editar turno': 'editar',
  'Borrar turno': 'borrar',
}

const RUTA_HORARIO = '/intranet/horario'
const RUTA_ASISTENCIA = '/intranet/horario/asistencia'

// la vista sale de la URL: /intranet/horario/asistencia muestra la asistencia, si no el horario
const vistaDesdeRuta = () =>
  window.location.pathname.replace(/\/+$/, '') === RUTA_ASISTENCIA ? 'asistencia' : 'horario'

export default function ScheduleSection() {
  const [horarios, setHorarios] = useState([])
  const [estado, setEstado] = useState('loading')
  const [errorCarga, setErrorCarga] = useState('')
  // modal abierto ('crear', 'editar' o 'borrar') y el turno elegido para editar o borrar
  const [modal, setModal] = useState(null)
  const [turnoElegido, setTurnoElegido] = useState(null)
  const [errorBorrar, setErrorBorrar] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [vista, setVista] = useState(vistaDesdeRuta)
  // semana que se ve en la tabla ("AAAA-MM-DD" de su lunes), parte en la semana actual
  const [semana, setSemana] = useState(semanaActual)
  // cuenta los cambios de turnos para que la asistencia recargue los dias con turno
  const [cambiosTurnos, setCambiosTurnos] = useState(0)

  // con los botones atras/adelante del navegador (o el link de Horario) la vista sigue a la URL
  useEffect(() => {
    const sincronizarVista = () => setVista(vistaDesdeRuta())
    window.addEventListener('popstate', sincronizarVista)
    return () => window.removeEventListener('popstate', sincronizarVista)
  }, [])

  const alternarAsistencia = () => {
    const ruta = vista === 'asistencia' ? RUTA_HORARIO : RUTA_ASISTENCIA
    window.history.pushState(null, '', ruta)
    setVista(vistaDesdeRuta())
  }

  const cargarHorarios = useCallback(() => {
    return getHorarios(semana)
      .then((data) => {
        setHorarios(data)
        setEstado('success')
      })
      .catch((error) => {
        setErrorCarga(error.message)
        setEstado('error')
      })
  }, [semana])

  useEffect(() => {
    cargarHorarios()
  }, [cargarHorarios])

  const cambiarSemana = (nuevaSemana) => {
    setEstado('loading')
    setSemana(nuevaSemana)
  }

  const dias = horarios.map(({ id, dia }) => ({ id, dia }))
  // turnos de la semana con su dia y fecha (ej: "Jueves 15") para el selector de editar y borrar
  // los de dias que ya pasaron quedan fuera porque no se pueden editar ni borrar
  const hoy = diaDeHoy()
  const turnosEditables = horarios.flatMap((horario) =>
    horario.turnos
      .filter((turno) => turno.fecha.slice(0, 10) >= hoy)
      .map((turno) => ({ ...turno, dia: `${horario.dia} ${Number(turno.fecha.slice(8, 10))}` })),
  )
  const sinTurnosEditables = 'No hay turnos de hoy en adelante en esta semana. Los turnos de días que ya pasaron no se pueden editar ni borrar.'

  const abrirModal = (tipo) => {
    setTurnoElegido(null)
    setErrorBorrar('')
    setModal(tipo)
  }

  const cerrarModal = () => {
    setModal(null)
    setTurnoElegido(null)
  }

  // despues de guardar se muestra la semana del turno (si es otra) o se recarga la actual
  const guardarYRecargar = async (peticion) => {
    const resultado = await peticion
    const semanaDelTurno = resultado?.fecha ? lunesDe(resultado.fecha.slice(0, 10)) : semana
    if (semanaDelTurno !== semana) cambiarSemana(semanaDelTurno)
    else await cargarHorarios()
    setCambiosTurnos((cambios) => cambios + 1)
    cerrarModal()
  }

  const confirmarBorrado = async () => {
    setBorrando(true)
    setErrorBorrar('')
    try {
      await guardarYRecargar(eliminarTurno(turnoElegido.id))
    } catch (error) {
      setErrorBorrar(error.message)
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="schedule">
      <div className="area-actions area-actions--horario" role="group" aria-label="Acciones de horario">
        {scheduleActions.map((action) => (
          <button
            className={`area-action${action === 'Asistencia' && vista === 'asistencia' ? ' is-active' : ''}`}
            type="button"
            key={action}
            onClick={
              action === 'Asistencia'
                ? alternarAsistencia
                : MODAL_POR_ACCION[action]
                  ? () => abrirModal(MODAL_POR_ACCION[action])
                  : undefined
            }
            aria-pressed={action === 'Asistencia' ? vista === 'asistencia' : undefined}
            disabled={MODAL_POR_ACCION[action] && estado !== 'success'}
          >
            {action}
          </button>
        ))}
      </div>

      {vista === 'asistencia' && (
        <div className="schedule-table-container">
          <AttendanceSection cambiosTurnos={cambiosTurnos} />
        </div>
      )}

      <div className="schedule-table-container" aria-busy={estado === 'loading'} hidden={vista === 'asistencia'}>
        <div className="schedule-week">
          <WeekPicker lunes={semana} onChange={cambiarSemana} />
        </div>
        {estado === 'loading' && <p role="status">Cargando horario...</p>}
        {estado === 'error' && (
          <p className="inventory-error" role="alert">
            No se pudo cargar el horario: {errorCarga}
          </p>
        )}
        {estado === 'success' && <ScheduleTable horarios={horarios} />}
      </div>

      {modal === 'crear' && (
        <Modal title="Añadir turno" onClose={cerrarModal}>
          <TurnoForm
            dias={dias}
            textoBoton="Añadir turno"
            onCancel={cerrarModal}
            onSubmit={(turno) => guardarYRecargar(crearTurno(turno))}
          />
        </Modal>
      )}

      {modal === 'editar' && (
        <Modal title="Editar turno" onClose={cerrarModal}>
          {turnoElegido ? (
            <TurnoForm
              dias={dias}
              turno={turnoElegido}
              textoBoton="Guardar cambios"
              onCancel={() => setTurnoElegido(null)}
              onSubmit={(turno) => guardarYRecargar(actualizarTurno(turnoElegido.id, turno))}
            />
          ) : (
            <TurnoSelector turnos={turnosEditables} onSelect={setTurnoElegido} mensajeVacio={sinTurnosEditables} />
          )}
        </Modal>
      )}

      {modal === 'borrar' && (
        <Modal title="Borrar turno" onClose={cerrarModal}>
          {turnoElegido ? (
            <div className="turno-form">
              <p>
                ¿Seguro que quieres borrar el turno de{' '}
                <strong>{turnoElegido.usuario.nombre_usuario}</strong> el{' '}
                <strong>{turnoElegido.dia}</strong> desde las {turnoElegido.hora_inicio}
                {turnoElegido.hora_fin && ` hasta las ${turnoElegido.hora_fin}`}?
              </p>
              {errorBorrar && <p className="turno-form__error" role="alert">{errorBorrar}</p>}
              <div className="modal__actions">
                <button type="button" className="modal__button" onClick={() => setTurnoElegido(null)}>
                  Volver
                </button>
                <button
                  type="button"
                  className="modal__button modal__button--danger"
                  onClick={confirmarBorrado}
                  disabled={borrando}
                >
                  {borrando ? 'Borrando...' : 'Borrar turno'}
                </button>
              </div>
            </div>
          ) : (
            <TurnoSelector turnos={turnosEditables} onSelect={setTurnoElegido} mensajeVacio={sinTurnosEditables} />
          )}
        </Modal>
      )}
    </div>
  )
}

// tabla semanal: una fila por bloque de una hora y una columna por dia de la semana elegida
// un turno aparece en todos los bloques entre su hora de llegada y su hora de ida
// los dias que ya pasaron se ven mas apagados
function ScheduleTable({ horarios }) {
  const hoy = diaDeHoy()
  const esPasado = (horario) => horario.fecha.slice(0, 10) < hoy

  // para cada dia: hora -> nombres de quienes tienen turno en ese bloque
  const ocupacion = horarios.map((horario) => {
    const porHora = {}
    for (const turno of horario.turnos) {
      for (const h of horasDelTurno(turno)) {
        porHora[h] = [...(porHora[h] ?? []), turno]
      }
    }
    return porHora
  })

  return (
    <div className="schedule-table-scroll">
      <table className="schedule-table">
        <caption className="visually-hidden">Horario semanal de turnos</caption>
        <thead>
          <tr>
            <th scope="col">Hora</th>
            {horarios.map((horario) => (
              <th scope="col" key={horario.id} className={horario.fecha.slice(0, 10) === hoy ? 'is-hoy' : undefined}>
                {horario.dia}
                <span className="schedule-table__fecha">{Number(horario.fecha.slice(8, 10))}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloquesDelDia.map((h) => (
            <tr key={h}>
              <th scope="row">
                {formatearHora(h)}
                <br />
                {formatearHora(h + 1)}
              </th>
              {horarios.map((horario, i) => {
                const turnosDelBloque = ocupacion[i][h] ?? []
                return (
                  <td
                    className={[turnosDelBloque.length > 0 && 'has-turno', esPasado(horario) && 'is-pasado'].filter(Boolean).join(' ') || undefined}
                    key={horario.id}
                  >
                    {turnosDelBloque.map((turno) => (
                      <span className="schedule-table__name" key={turno.id}>
                        {turno.usuario.nombre_usuario}
                      </span>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
