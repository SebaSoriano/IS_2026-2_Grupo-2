import { useEffect, useRef, useState } from 'react'
import { isoATexto, textoAIso } from '../utils/fechas.js'
import './CampoFecha.css'

// pone los guiones mientras se escribe "06032025" -> "06-03-2025".
function aplicarMascara(texto) {
  const digitos = texto.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 4)}-${digitos.slice(4)}`
}

// Revisa el texto escrito y devuelve el mensaje de error, o '' si está bien.
// min y max llegan en formato ISO ("2025-03-06"), y los textos ISO se pueden comparar
// con < y > porque el año va primero, luego el mes y luego el día.
function revisarTexto(texto, min, max) {
  if (texto === '') return ''
  const iso = textoAIso(texto)
  if (!iso) return 'Escribe una fecha que exista, con formato DD-MM-AAAA'
  if (min && iso < min) return `La fecha no puede ser anterior al ${isoATexto(min)}`
  if (max && iso > max) return `La fecha no puede ser posterior al ${isoATexto(max)}`
  return ''
}

// Campo de fecha en formato chileno DD-MM-AAAA.
//
// el <input type="date"> del navegador muestra la fecha según el idioma del computador
// por eso este campo es un string DD-MM-AAAA
export default function CampoFecha({ name, value = '', onChange, min, max, required = false, label }) {
  // texto que se ve en el campo, en formato DD-MM-AAAA
  const [texto, setTexto] = useState(isoATexto(value))
  // Si el formulario cambia value por su cuenta (por ejemplo, al limpiar los filtros),
  // value deja de ser igual a este y el texto se actualiza para mostrar el valor nuevo.
  const [entregado, setEntregado] = useState(value)
  if (value !== entregado) {
    setEntregado(value)
    setTexto(isoATexto(value))
  }

  const error = revisarTexto(texto, min, max)
  const textoRef = useRef(null)
  const calendarioRef = useRef(null)

  // setCustomValidity le dice al navegador que el campo tiene un error.
  useEffect(() => {
    textoRef.current?.setCustomValidity(error)
  }, [error])

  // guarda el texto nuevo y le avisa al formulario. Si la fecha no es válida se entrega ''
  function cambiarTexto(nuevoTexto) {
    setTexto(nuevoTexto)
    const iso = revisarTexto(nuevoTexto, min, max) === '' ? (textoAIso(nuevoTexto) ?? '') : ''
    setEntregado(iso)
    onChange({ target: { name, value: iso } })
  }

  // showPicker() abre el calendario del <input type="date"> escondido
  function abrirCalendario() {
    const calendario = calendarioRef.current
    if (!calendario) return
    if (typeof calendario.showPicker === 'function') calendario.showPicker()
    else calendario.focus()
  }

  return (
    <span className="campo-fecha">
      <span className="campo-fecha__fila">
        <input
          ref={textoRef}
          className="campo-fecha__texto"
          name={name}
          type="text"
          inputMode="numeric"
          placeholder="DD-MM-AAAA"
          value={texto}
          onChange={(event) => cambiarTexto(aplicarMascara(event.target.value))}
          maxLength={10}
          required={required}
          aria-label={label}
          aria-invalid={error !== ''}
        />
        <button
          className="campo-fecha__boton"
          type="button"
          onClick={abrirCalendario}
          aria-label="Elegir la fecha en el calendario"
          title="Elegir en el calendario"
        >
          📅
        </button>
        {/* Calendario del navegador. No se ve ni se puede enfocar con Tab (tabIndex -1):
            solo se usa para que aparezca el calendario al presionar el botón 📅 */}
        <input
          ref={calendarioRef}
          className="campo-fecha__calendario"
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={textoAIso(texto) ?? ''}
          min={min}
          max={max}
          onChange={(event) => cambiarTexto(isoATexto(event.target.value))}
        />
      </span>
      {error && <span className="campo-fecha__error">{error}</span>}
    </span>
  )
}