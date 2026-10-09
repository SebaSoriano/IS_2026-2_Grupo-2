import { useState } from 'react'

// quita tildes y mayusculas para que "maximiliano" encuentre a "Maximiliano" y "miercoles" a "Miércoles"
const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const describirHoras = (turno) =>
  turno.hora_fin ? `${turno.hora_inicio} a ${turno.hora_fin}` : `${turno.hora_inicio} (sin hora de ida)`

// lista de todos los turnos para elegir cual editar o borrar, con un filtro por nombre o dia
export default function TurnoSelector({ turnos, onSelect }) {
  const [filtro, setFiltro] = useState('')

  const visibles = turnos.filter((turno) =>
    normalizar(`${turno.usuario.nombre_usuario} ${turno.dia}`).includes(normalizar(filtro.trim())),
  )

  return (
    <div className="turno-selector">
      <label className="turno-form__label" htmlFor="turno-selector-filtro">Buscar turno</label>
      <input
        id="turno-selector-filtro"
        className="turno-form__input"
        type="text"
        autoComplete="off"
        placeholder="Nombre o día..."
        value={filtro}
        onChange={(event) => setFiltro(event.target.value)}
        autoFocus
      />
      <ul className="turno-selector__list">
        {visibles.length === 0 && <li className="user-search__empty">No hay turnos que coincidan</li>}
        {visibles.map((turno) => (
          <li key={turno.id}>
            <button type="button" className="turno-selector__item" onClick={() => onSelect(turno)}>
              <span>{turno.usuario.nombre_usuario}</span>
              <small>{turno.dia} · {describirHoras(turno)}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
