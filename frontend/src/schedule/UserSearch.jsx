import { useEffect, useId, useState } from 'react'
import { getUsuarios } from '../services/api.js'

// pasa el texto a minusculas y sin tildes para comparar ("jose" encuentra a "José" y "JOSÉ")
const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// deja el rut solo con numeros y k para que "12.345.678-9", "12345678-9" y "123456789" coincidan
const limpiarRut = (texto) => texto.replace(/[^\dk]/gi, '').toLowerCase()

// busca por nombre, o por rut cuando lo escrito tiene algun numero
// (sin esa condicion, escribir "k" traeria a todos los rut que terminan en K)
const coincide = (usuario, texto) => {
  if (normalizar(usuario.nombre_usuario).includes(normalizar(texto))) return true
  return /\d/.test(texto) && limpiarRut(usuario.rut_usuario).includes(limpiarRut(texto))
}

// campo que al hacer click muestra a todas las personas y al escribir va filtrando la lista por nombre o rut
// los usuarios se piden una sola vez y el filtro se hace aqui para que la lista responda al instante
export default function UserSearch({ usuario, onSelect }) {
  const [texto, setTexto] = useState(usuario?.nombre_usuario ?? '')
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const [error, setError] = useState('')
  const id = useId()

  useEffect(() => {
    let vigente = true
    getUsuarios()
      .then((data) => vigente && setUsuarios(data))
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargando(false))

    // si el pop-up se cierra antes de que responda la API, no se actualiza el estado
    return () => {
      vigente = false
    }
  }, [])

  // con una persona ya elegida se muestra la lista completa, asi se puede cambiar sin borrar el texto
  const filtro = usuario ? '' : texto.trim()
  const resultados = filtro ? usuarios.filter((u) => coincide(u, filtro)) : usuarios

  const elegir = (elegido) => {
    onSelect(elegido)
    setTexto(elegido.nombre_usuario)
    setAbierto(false)
  }

  const abrir = () => {
    setAbierto(true)
    setActivo(0)
  }

  const manejarTeclas = (event) => {
    // Enter en este campo solo sirve para elegir una persona, nunca envia el formulario
    if (event.key === 'Enter') event.preventDefault()
    if (event.key === 'ArrowDown' && !abierto) return abrir()
    if (!abierto || resultados.length === 0) return
    if (event.key === 'ArrowDown') setActivo((i) => Math.min(i + 1, resultados.length - 1))
    else if (event.key === 'ArrowUp') setActivo((i) => Math.max(i - 1, 0))
    else if (event.key === 'Enter') elegir(resultados[activo])
    else if (event.key === 'Escape') {
      event.stopPropagation()
      setAbierto(false)
    } else return
    event.preventDefault()
  }

  return (
    <div className="user-search">
      <label className="turno-form__label" htmlFor={`${id}-input`}>Persona</label>
      <input
        id={`${id}-input`}
        className="turno-form__input"
        type="text"
        autoComplete="off"
        placeholder="Selecciona o escribe el nombre o RUT..."
        value={texto}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-activedescendant={abierto && resultados[activo] ? `${id}-${activo}` : undefined}
        onChange={(event) => {
          setTexto(event.target.value)
          abrir()
          // si cambia el texto, el usuario elegido antes deja de valer
          if (usuario) onSelect(null)
        }}
        // mousedown y no click: al hacer click en el espacio de la etiqueta "Persona" (que ocupa todo el ancho)
        // el navegador manda un click al input y la lista volvia a abrirse aunque se quisiera salir del campo
        onMouseDown={abrir}
        onBlur={() => setAbierto(false)}
        onKeyDown={manejarTeclas}
        autoFocus
      />
      {abierto && (
        <ul className="user-search__list" id={`${id}-lista`} role="listbox">
          {error && <li className="user-search__empty">{error}</li>}
          {!error && cargando && <li className="user-search__empty">Cargando personas...</li>}
          {!error && !cargando && resultados.length === 0 && (
            <li className="user-search__empty">Sin coincidencias</li>
          )}
          {resultados.map((resultado, i) => (
            <li
              key={resultado.rut_usuario}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === activo}
              className={`user-search__option${i === activo ? ' is-active' : ''}`}
              // mousedown en vez de click para elegir antes de que el input pierda el foco
              onMouseDown={(event) => {
                event.preventDefault()
                elegir(resultado)
              }}
            >
              <span>{resultado.nombre_usuario}</span>
              <small>{resultado.rut_usuario}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
