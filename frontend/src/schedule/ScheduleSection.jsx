import { useCallback, useEffect, useState } from 'react'
import { scheduleActions } from '../data/scheduleActions.js'
import { actualizarTurno, crearTurno, eliminarTurno, getHorarios } from '../services/api.js'
import Modal from './Modal.jsx'
import TurnoForm from './TurnoForm.jsx'
import TurnoSelector from './TurnoSelector.jsx'
import { bloquesDelDia, formatearHora, horasDelTurno } from './horas.js'

// por ahora solo estas acciones abren un pop-up (Asistencia y Exportar quedan pendientes)
const MODAL_POR_ACCION = {
  'Añadir turno': 'crear',
  'Editar turno': 'editar',
  'Borrar turno': 'borrar',
}

export default function ScheduleSection() {
  const [horarios, setHorarios] = useState([])
  const [estado, setEstado] = useState('loading')
  const [errorCarga, setErrorCarga] = useState('')
  // modal abierto ('crear', 'editar' o 'borrar') y el turno elegido para editar o borrar
  const [modal, setModal] = useState(null)
  const [turnoElegido, setTurnoElegido] = useState(null)
  const [errorBorrar, setErrorBorrar] = useState('')
  const [borrando, setBorrando] = useState(false)

  const cargarHorarios = useCallback(() => {
    return getHorarios()
      .then((data) => {
        setHorarios(data)
        setEstado('success')
      })
      .catch((error) => {
        setErrorCarga(error.message)
        setEstado('error')
      })
  }, [])

  useEffect(() => {
    cargarHorarios()
  }, [cargarHorarios])

  const dias = horarios.map(({ id, dia }) => ({ id, dia }))
  // todos los turnos de la semana con el nombre de su dia, para el selector de editar y borrar
  const turnos = horarios.flatMap((horario) =>
    horario.turnos.map((turno) => ({ ...turno, dia: horario.dia })),
  )

  const abrirModal = (tipo) => {
    setTurnoElegido(null)
    setErrorBorrar('')
    setModal(tipo)
  }

  const cerrarModal = () => {
    setModal(null)
    setTurnoElegido(null)
  }

  // despues de guardar se recarga el horario para ver el turno en la tabla
  const guardarYRecargar = async (peticion) => {
    await peticion
    await cargarHorarios()
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
            className="area-action"
            type="button"
            key={action}
            onClick={MODAL_POR_ACCION[action] ? () => abrirModal(MODAL_POR_ACCION[action]) : undefined}
            disabled={MODAL_POR_ACCION[action] && estado !== 'success'}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="schedule-table-container" aria-busy={estado === 'loading'}>
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
            <TurnoSelector turnos={turnos} onSelect={setTurnoElegido} />
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
            <TurnoSelector turnos={turnos} onSelect={setTurnoElegido} />
          )}
        </Modal>
      )}
    </div>
  )
}

// tabla semanal: una fila por bloque de una hora y una columna por dia
// un turno aparece en todos los bloques entre su hora de llegada y su hora de ida
function ScheduleTable({ horarios }) {
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
              <th scope="col" key={horario.id}>{horario.dia}</th>
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
                  <td className={turnosDelBloque.length > 0 ? 'has-turno' : undefined} key={horario.id}>
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
