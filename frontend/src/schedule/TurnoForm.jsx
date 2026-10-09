import { useState } from 'react'
import HourPicker from './HourPicker.jsx'
import UserSearch from './UserSearch.jsx'
import {
  HORA_MAX,
  HORA_MIN,
  HORA_PREDETERMINADA,
  formatearHora,
  leerHora,
  rango,
} from './horas.js'

const horasDeLlegada = rango(HORA_MIN, HORA_MAX - 1)

// formulario para añadir o editar un turno: persona, dia, hora de llegada y hora de ida opcional
export default function TurnoForm({ dias, turno, textoBoton, onSubmit, onCancel }) {
  const [usuario, setUsuario] = useState(turno?.usuario ?? null)
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
        horario_id: horarioId,
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

      <fieldset className="day-picker">
        <legend className="turno-form__label">Día</legend>
        <div className="day-picker__options">
          {dias.map((dia) => (
            <label className={`day-picker__option${horarioId === dia.id ? ' is-selected' : ''}`} key={dia.id}>
              <input
                type="radio"
                name="horario_id"
                value={dia.id}
                checked={horarioId === dia.id}
                onChange={() => setHorarioId(dia.id)}
              />
              {dia.dia}
            </label>
          ))}
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
