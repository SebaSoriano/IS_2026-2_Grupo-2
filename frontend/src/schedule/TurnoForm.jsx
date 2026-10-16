import { useState } from 'react'
import HourPicker from './HourPicker.jsx'
import UserSearch from './UserSearch.jsx'
import WeekPicker from './WeekPicker.jsx'
import { diaDeHoy, fechaDelDia, lunesDe, semanaActual } from './calendario.js'
import {
  HORA_MAX,
  HORA_MIN,
  HORA_PREDETERMINADA,
  formatearHora,
  leerHora,
  rango,
} from './horas.js'

const horasDeLlegada = rango(HORA_MIN, HORA_MAX - 1)

// formulario para añadir o editar un turno: persona, semana, dia, hora de llegada y hora de ida opcional
// la semana parte en la actual (o en la del turno al editar) y no se puede ir a semanas anteriores
// en la semana actual los dias que ya pasaron quedan bloqueados
export default function TurnoForm({ dias, turno, textoBoton, onSubmit, onCancel }) {
  const [usuario, setUsuario] = useState(turno?.usuario ?? null)
  const [semana, setSemana] = useState(() => (turno ? lunesDe(turno.fecha.slice(0, 10)) : semanaActual()))
  const [horarioId, setHorarioId] = useState(turno?.horario_id ?? null)
  const [inicio, setInicio] = useState(turno ? leerHora(turno.hora_inicio) : HORA_PREDETERMINADA)
  const [fin, setFin] = useState(turno?.hora_fin ? leerHora(turno.hora_fin) : null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiarInicio = (h) => {
    setInicio(h)
    // si la hora de ida queda antes o igual que la llegada, se quita
    if (fin != null && fin <= h) setFin(null)
  }

  const hoy = diaDeHoy()
  const esDiaPasado = (diaId) => fechaDelDia(semana, diaId) < hoy

  const cambiarSemana = (nuevaSemana) => {
    setSemana(nuevaSemana)
    // si el dia elegido queda en el pasado al volver a la semana actual, se quita
    if (horarioId && fechaDelDia(nuevaSemana, horarioId) < hoy) setHorarioId(null)
  }

  const finReal = fin ?? inicio + 1
  const bloques = finReal - inicio

  const enviar = async (event) => {
    event.preventDefault()
    if (!usuario) return setError('Selecciona una persona de la lista.')
    if (!horarioId) return setError('Selecciona el día del turno.')

    setGuardando(true)
    setError('')
    try {
      await onSubmit({
        rut_usuario: usuario.rut_usuario,
        // el backend calcula el dia de la semana a partir de la fecha
        fecha: fechaDelDia(semana, horarioId),
        hora_inicio: formatearHora(inicio),
        hora_fin: fin == null ? null : formatearHora(fin),
      })
    } catch (err) {
      // si el backend rechaza los datos, los mensajes de Zod vienen en err.details
      const detalles = err.details?.map((detalle) => detalle.mensaje).join('. ')
      setError(detalles || err.message)
      setGuardando(false)
    }
  }

  return (
    <form className="turno-form" onSubmit={enviar} noValidate>
      <UserSearch usuario={usuario} onSelect={setUsuario} />

      <div>
        <span className="turno-form__label">Semana</span>
        <WeekPicker lunes={semana} onChange={cambiarSemana} minimo={semanaActual()} />
      </div>

      <fieldset className="day-picker">
        <legend className="turno-form__label">Día</legend>
        <div className="day-picker__options">
          {dias.map((dia) => {
            const pasado = esDiaPasado(dia.id)
            return (
              <label
                className={`day-picker__option${horarioId === dia.id ? ' is-selected' : ''}${pasado ? ' is-disabled' : ''}`}
                key={dia.id}
                title={pasado ? 'Este día ya pasó' : undefined}
              >
                <input
                  type="radio"
                  name="horario_id"
                  value={dia.id}
                  checked={horarioId === dia.id}
                  onChange={() => setHorarioId(dia.id)}
                  disabled={pasado}
                />
                {dia.dia} <small>{Number(fechaDelDia(semana, dia.id).slice(8))}</small>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="turno-form__hours">
        <HourPicker
          label="Hora de llegada"
          value={inicio}
          options={horasDeLlegada}
          onChange={cambiarInicio}
        />
        <HourPicker
          label="Hora de ida (opcional)"
          value={fin}
          options={rango(inicio + 1, HORA_MAX)}
          onChange={setFin}
          onClear={() => setFin(null)}
          placeholder="Sin hora de ida"
        />
      </div>

      <p className="turno-form__summary">
        Turno de {formatearHora(inicio)} a {formatearHora(finReal)} · {bloques}{' '}
        {bloques === 1 ? 'bloque' : 'bloques'}
      </p>

      {error && <p className="turno-form__error" role="alert">{error}</p>}

      <div className="modal__actions">
        <button type="button" className="modal__button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="modal__button modal__button--primary" disabled={guardando}>
          {guardando ? 'Guardando...' : textoBoton}
        </button>
      </div>
    </form>
  )
}
