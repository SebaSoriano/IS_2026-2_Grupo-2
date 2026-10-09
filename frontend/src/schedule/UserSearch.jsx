import { useEffect, useId, useState } from 'react'
import { buscarUsuarios } from '../services/api.js'

// campo de texto que va mostrando los usuarios cuyo nombre coincide con lo escrito
// la busqueda no distingue mayusculas porque la hace el backend con mode 'insensitive'
export default function UserSearch({ usuario, onSelect }) {
  const [texto, setTexto] = useState(usuario?.nombre_usuario ?? '')
  const [resultados, setResultados] = useState([])
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const [error, setError] = useState('')
  const id = useId()

  // se espera un momento despues de la ultima tecla para no consultar la API en cada letra
  useEffect(() => {
    // con el campo vacio o con la persona ya elegida no se busca (la lista queda oculta)
    const nombre = texto.trim()
    if (!nombre || nombre === usuario?.nombre_usuario) return undefined

    let esLaUltima = true
    const espera = setTimeout(() => {
      buscarUsuarios(nombre)
        .then((data) => {
          if (!esLaUltima) return
          setResultados(data)
          setActivo(0)
          setError('')
        })
        .catch((err) => esLaUltima && setError(err.message))
    }, 250)

    return () => {
      esLaUltima = false
      clearTimeout(espera)
    }
  }, [texto, usuario])

  const elegir = (elegido) => {
    onSelect(elegido)
    setTexto(elegido.nombre_usuario)
    setAbierto(false)
  }

  const manejarTeclas = (event) => {
    // Enter en este campo solo sirve para elegir una persona, nunca envia el formulario
    if (event.key === 'Enter') event.preventDefault()
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

  const mostrarLista = abierto && texto.trim() !== '' && texto !== usuario?.nombre_usuario

  return (
    <div className="user-search">
      <label className="turno-form__label" htmlFor={`${id}-input`}>Persona</label>
      <input
        id={`${id}-input`}
        className="turno-form__input"
        type="text"
        autoComplete="off"
        placeholder="Escribe el nombre..."
        value={texto}
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={`${id}-lista`}
        aria-activedescendant={mostrarLista && resultados[activo] ? `${id}-${activo}` : undefined}
        onChange={(event) => {
          setTexto(event.target.value)
          setAbierto(true)
          // si cambia el texto, el usuario elegido antes deja de valer
          if (usuario) onSelect(null)
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={manejarTeclas}
        autoFocus
      />
      {mostrarLista && (
        <ul className="user-search__list" id={`${id}-lista`} role="listbox">
          {error && <li className="user-search__empty">{error}</li>}
          {!error && resultados.length === 0 && (
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
