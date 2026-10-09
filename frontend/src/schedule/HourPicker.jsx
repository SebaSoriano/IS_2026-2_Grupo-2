import { useEffect, useId, useRef, useState } from 'react'
import { formatearHora } from './horas.js'

const ALTO_OPCION = 40

// selector tipo reloj: una columna de horas con scroll, la elegida queda resaltada
// se confirma con ✓ o se descarta con ✕ (o Escape)
export default function HourPicker({ label, value, options, onChange, placeholder, onClear }) {
  const [abierto, setAbierto] = useState(false)
  const [marcada, setMarcada] = useState(value ?? options[0])
  const listaRef = useRef(null)
  const contenedorRef = useRef(null)
  const labelId = useId()

  // al abrir, la columna recibe el foco para moverse con las flechas
  // (React solo aplica autoFocus a inputs y botones, por eso se hace a mano)
  useEffect(() => {
    if (abierto) listaRef.current?.focus({ preventScroll: true })
  }, [abierto])

  // la hora marcada se mantiene centrada dentro de la columna
  useEffect(() => {
    if (!abierto || !listaRef.current) return
    const indice = Math.max(options.indexOf(marcada), 0)
    const lista = listaRef.current
    lista.scrollTop = indice * ALTO_OPCION - (lista.clientHeight - ALTO_OPCION) / 2
  }, [abierto, marcada, options])

  // cerrar si se hace click fuera del selector
  useEffect(() => {
    if (!abierto) return undefined
    const cerrarFuera = (event) => {
      if (!contenedorRef.current?.contains(event.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', cerrarFuera)
    return () => document.removeEventListener('mousedown', cerrarFuera)
  }, [abierto])

  const abrir = () => {
    setMarcada(options.includes(value) ? value : options[0])
    setAbierto(true)
  }

  const mover = (paso) => {
    const indice = options.indexOf(marcada) + paso
    if (indice >= 0 && indice < options.length) setMarcada(options[indice])
  }

  const confirmar = () => {
    onChange(marcada)
    setAbierto(false)
  }

  const manejarTeclas = (event) => {
    if (event.key === 'ArrowUp') mover(-1)
    else if (event.key === 'ArrowDown') mover(1)
    else if (event.key === 'Enter') confirmar()
    else if (event.key === 'Escape') {
      // que el Escape cierre solo el reloj y no el pop-up completo
      event.stopPropagation()
      setAbierto(false)
    } else return
    event.preventDefault()
  }

  return (
    <div className="hour-picker" ref={contenedorRef}>
      <span className="turno-form__label" id={labelId}>{label}</span>
      <div className="hour-picker__field">
        <button
          type="button"
          className={`hour-picker__value${value == null ? ' is-empty' : ''}`}
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={abierto}
          onClick={() => (abierto ? setAbierto(false) : abrir())}
        >
          {value == null ? placeholder : formatearHora(value)}
          <span className="hour-picker__icon" aria-hidden="true">🕒</span>
        </button>
        {onClear && value != null && (
          <button type="button" className="hour-picker__clear" onClick={onClear} aria-label={`Quitar ${label.toLowerCase()}`}>
            ✕
          </button>
        )}
      </div>

      {abierto && (
        <div className="hour-picker__popover" onKeyDown={manejarTeclas}>
          <button type="button" className="hour-picker__arrow" onClick={() => mover(-1)} aria-label="Hora anterior">
            ▲
          </button>
          <ul
            className="hour-picker__list"
            ref={listaRef}
            role="listbox"
            aria-labelledby={labelId}
            aria-activedescendant={`${labelId}-${marcada}`}
            tabIndex={0}
          >
            {options.map((h) => (
              <li
                key={h}
                id={`${labelId}-${h}`}
                role="option"
                aria-selected={h === marcada}
                className={`hour-picker__option${h === marcada ? ' is-selected' : ''}`}
                onClick={() => setMarcada(h)}
                onDoubleClick={() => {
                  onChange(h)
                  setAbierto(false)
                }}
              >
                {formatearHora(h)}
              </li>
            ))}
          </ul>
          <button type="button" className="hour-picker__arrow" onClick={() => mover(1)} aria-label="Hora siguiente">
            ▼
          </button>
          <div className="hour-picker__actions">
            <button type="button" onClick={confirmar} aria-label="Confirmar hora">✓</button>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cancelar">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
