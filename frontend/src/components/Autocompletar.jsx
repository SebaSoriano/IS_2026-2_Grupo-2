import { useEffect, useId, useRef, useState } from 'react'
import './Autocompletar.css'

// Deja un texto listo para comparar: en minúsculas y sin tildes.
// normalize('NFD') separa cada letra de su tilde ("á" pasa a "a" + "´")
// y el replace borra esas tildes sueltas (están entre ̀ y ͯ).
// Así "gonzalez" encuentra "González" y "RABIA" encuentra "antirrábica".
const normalizar = (texto) =>
  (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Ordena las opciones según qué tan bien calzan con lo escrito (la "predicción"):
// 0 = el texto empieza con lo escrito, 1 = alguna palabra empieza con lo escrito,
// 2 = lo escrito aparece en cualquier otra parte. Las que no lo contienen se descartan.
// Si dos opciones calzan igual de bien, se ordenan alfabéticamente.
function predecir(opciones, escrito, maximo) {
  const buscado = normalizar(escrito).trim()
  const conPuntaje = []

  for (const opcion of opciones) {
    const texto = normalizar(opcion.texto)
    if (buscado === '') {
      conPuntaje.push({ opcion, puntaje: 0 })
      continue
    }
    const posicion = texto.indexOf(buscado)
    if (posicion === -1) continue
    let puntaje = 2
    if (posicion === 0) puntaje = 0
    else if (texto[posicion - 1] === ' ') puntaje = 1
    conPuntaje.push({ opcion, puntaje })
  }

  conPuntaje.sort(
    (a, b) => a.puntaje - b.puntaje || a.opcion.texto.localeCompare(b.opcion.texto, 'es'),
  )
  return conPuntaje.slice(0, maximo).map((item) => item.opcion)
}

// Pinta en negrita (<mark>) la parte de la opción que coincide con lo escrito.
// Se busca en el texto normalizado, pero se corta el texto original para conservar las tildes.
function Resaltado({ texto, escrito }) {
  const buscado = normalizar(escrito).trim()
  const normalizado = normalizar(texto)
  const posicion = buscado ? normalizado.indexOf(buscado) : -1
  // Si al normalizar cambió el largo (letras raras), no se resalta para no cortar mal
  if (posicion === -1 || normalizado.length !== texto.length) return texto

  return (
    <>
      {texto.slice(0, posicion)}
      <mark>{texto.slice(posicion, posicion + buscado.length)}</mark>
      {texto.slice(posicion + buscado.length)}
    </>
  )
}

// campo de texto con "búsqueda con predicción": mientras se escribe aparece debajo
// se puede usar con el teclado: flechas para moverse, Enter para elegir y Esc para cerrar.
export default function Autocompletar({
  opciones,
  texto,
  onCambiarTexto,
  onElegir,
  name,
  placeholder,
  required = false,
  maxLength,
  error = '',
  extra = null,
  label,
  maximo = 8,
}) {
  const [abierta, setAbierta] = useState(false)
  // Posición de la opción marcada con las flechas (-1 = ninguna)
  const [activa, setActiva] = useState(-1)
  const inputRef = useRef(null)
  // useId crea un id único, así se pueden usar varios Autocompletar en la misma página
  // sin que sus listas se confundan
  const idLista = useId()

  const sugerencias = abierta ? predecir(opciones, texto, maximo) : []

  // El mensaje de error también lo conoce el navegador: así no deja enviar el formulario
  useEffect(() => {
    inputRef.current?.setCustomValidity(error)
  }, [error])

  function escribir(event) {
    onCambiarTexto(event.target.value)
    setAbierta(true)
    // al escribir, la primera sugerencia queda marcada para elegirla rápido con Enter
    setActiva(0)
  }

  function elegir(opcion) {
    onElegir(opcion)
    setAbierta(false)
    setActiva(-1)
  }

  function teclaPresionada(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setAbierta(true)
      setActiva(Math.min(activa + 1, sugerencias.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiva(Math.max(activa - 1, 0))
    } else if (event.key === 'Enter' && abierta && sugerencias[activa]) {
      // preventDefault evita que Enter envíe el formulario cuando se está eligiendo una opción
      event.preventDefault()
      elegir(sugerencias[activa])
    } else if (event.key === 'Tab' && abierta && sugerencias[activa] && texto.trim() !== '') {
      // Tab completa con la sugerencia marcada y luego pasa al siguiente campo (no se cancela)
      elegir(sugerencias[activa])
    } else if (event.key === 'Escape' && abierta) {
      // Se detiene el evento para que Esc cierre solo la lista y no la ventana completa
      event.preventDefault()
      event.stopPropagation()
      setAbierta(false)
    }
  }

  return (
    <span className="autocompletar">
      <span className="autocompletar__fila">
        {/* role="combobox" y los aria-* le explican a los lectores de pantalla
            que este campo tiene una lista de sugerencias asociada */}
        <input
          ref={inputRef}
          className="autocompletar__input"
          name={name}
          type="text"
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={abierta && sugerencias.length > 0}
          aria-controls={idLista}
          aria-activedescendant={abierta && activa >= 0 ? `${idLista}-${activa}` : undefined}
          aria-invalid={error !== ''}
          autoComplete="off"
          value={texto}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          onChange={escribir}
          onFocus={() => setAbierta(true)}
          onBlur={() => setAbierta(false)}
          onKeyDown={teclaPresionada}
        />
        {extra}
      </span>

      {abierta && sugerencias.length > 0 && (
        <ul className="autocompletar__lista" id={idLista} role="listbox">
          {sugerencias.map((opcion, posicion) => (
            // onMouseDown + preventDefault: el click en la lista no le quita el foco al campo,
            // si no, el onBlur cerraría la lista antes de que el click alcance a elegir la opción
            <li
              key={opcion.valor}
              id={`${idLista}-${posicion}`}
              role="option"
              aria-selected={posicion === activa}
              className={posicion === activa ? 'autocompletar__opcion is-activa' : 'autocompletar__opcion'}
              onMouseDown={(event) => {
                event.preventDefault()
                elegir(opcion)
              }}
              onMouseEnter={() => setActiva(posicion)}
            >
              <span>
                <Resaltado texto={opcion.texto} escrito={texto} />
              </span>
              {opcion.detalle && <span className="autocompletar__detalle">{opcion.detalle}</span>}
            </li>
          ))}
        </ul>
      )}

      {error && <span className="autocompletar__error">{error}</span>}
    </span>
  )
}