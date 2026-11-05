import { useEffect, useState } from 'react'
import { getAdopciones, getAnimalesDisponibles } from '../services/api.js'
import AdoptionForm from './AdoptionForm.jsx'
import './AdoptionSection.css'
import { usePermisos } from '../sesion/sesion.js'

// Muestra una fecha de la base de datos como dd-mm-aaaa
function formatearFecha(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-CL', { timeZone: 'UTC' })
}

// Por ahora el nombre del adoptante se guarda al inicio de observaciones_adoptante,
// con el formato "Nombre: Carla Pérez | otras observaciones". Esta función lo extrae.
function nombreAdoptante(adoptante) {
  const texto = adoptante?.observaciones_adoptante ?? ''
  if (!texto.startsWith('Nombre: ')) return '—'
  return texto.slice('Nombre: '.length).split(' | ')[0]
}

export default function AdoptionSection() {
  // el Voluntario puede ver los animales disponibles y las adopciones, pero no registrar una
  const { puedeEditar } = usePermisos()
  // Qué tabla se ve: 'disponibles' o 'historial'
  const [vista, setVista] = useState('disponibles')
  const [animales, setAnimales] = useState([])
  const [adopciones, setAdopciones] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  // Cargar las dos listas al mismo tiempo al entrar a la pestaña
  useEffect(() => {
    Promise.all([getAnimalesDisponibles(), getAdopciones()])
      .then(([listaAnimales, listaAdopciones]) => {
        setAnimales(listaAnimales)
        setAdopciones(listaAdopciones)
        setEstado('listo')
      })
      .catch((error) => {
        setErrorCarga(error.message)
        setEstado('error')
      })
  }, [])

  const animalSeleccionado =
    animales.find((animal) => animal.id_animal === seleccionadoId) ?? null

  function cambiarVista(nuevaVista) {
    setVista(nuevaVista)
    setMensaje(null)
  }

  function abrirFormulario() {
    setMensaje(null)
    setFormularioAbierto(true)
  }

  function cerrarFormulario() {
    setFormularioAbierto(false)
  }

  // AdoptionForm llama a esta función cuando el backend registró la adopción
  async function adopcionRegistrada() {
    const animal = animalSeleccionado
    setFormularioAbierto(false)

    // El animal deja de estar disponible: se quita de la tabla
    setAnimales(animales.filter((actual) => actual.id_animal !== animal.id_animal))
    setSeleccionadoId(null)
    setMensaje({ tipo: 'exito', texto: `Adopción de ${animal.nombre_animal} registrada` })

    // Se vuelve a pedir el historial para que aparezca la nueva adopción con todos sus datos
    try {
      const listaAdopciones = await getAdopciones()
      setAdopciones(listaAdopciones)
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'La adopción se registró, pero no se pudo actualizar el historial. Recarga la página.',
      })
    }
  }

  return (
    <>
      <div
        className="area-actions area-actions--adopcion"
        role="group"
        aria-label="Acciones de adopción"
      >
        <button
          className={`area-action${vista === 'disponibles' ? ' is-active' : ''}`}
          type="button"
          aria-pressed={vista === 'disponibles'}
          onClick={() => cambiarVista('disponibles')}
        >
          Animales Disponibles
        </button>
        <button
          className={`area-action${vista === 'historial' ? ' is-active' : ''}`}
          type="button"
          aria-pressed={vista === 'historial'}
          onClick={() => cambiarVista('historial')}
        >
          Adopciones Registradas
        </button>
        {puedeEditar && (
          <>
          <button
            className="area-action"
            type="button"
            onClick={abrirFormulario}
            disabled={vista !== 'disponibles' || !animalSeleccionado}
          >
            Registrar Adopción
          </button>
          {vista === 'disponibles' && !animalSeleccionado && (
            <p className="adoption-actions-help">
              Selecciona un animal para registrar su adopción.
            </p>
          )}
          </>
        )}
      </div>

      <div className="adoption-table-container" aria-busy={estado === 'cargando'}>
        {mensaje && (
          <p className={`adoption-message adoption-message--${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </p>
        )}
        {estado === 'cargando' && <p role="status">Cargando adopciones...</p>}
        {estado === 'error' && (
          <p className="adoption-message adoption-message--error" role="alert">
            No se pudieron cargar los datos: {errorCarga}
          </p>
        )}

        {estado === 'listo' && vista === 'disponibles' && (
          <div className="adoption-table-scroll">
            <table className="adoption-table">
              <caption>Animales disponibles para adopción</caption>
              <thead>
                <tr>
                  <th scope="col">Seleccionar</th>
                  <th scope="col">ID</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Especie</th>
                  <th scope="col">Edad</th>
                  <th scope="col">Peso (kg)</th>
                  <th scope="col">Vía de ingreso</th>
                  <th scope="col">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {animales.length === 0 ? (
                  <tr>
                    <td className="adoption-table-empty" colSpan="8">
                      No hay animales disponibles.
                    </td>
                  </tr>
                ) : (
                  animales.map((animal) => (
                    <tr
                      key={animal.id_animal}
                      className={animal.id_animal === seleccionadoId ? 'is-selected' : ''}
                      onClick={() => setSeleccionadoId(animal.id_animal)}
                    >
                      <td>
                        <input
                          type="radio"
                          name="adopcion-animal-seleccionado"
                          aria-label={`Seleccionar a ${animal.nombre_animal}`}
                          checked={animal.id_animal === seleccionadoId}
                          onChange={() => setSeleccionadoId(animal.id_animal)}
                        />
                      </td>
                      <td>{animal.id_animal}</td>
                      <td>{animal.nombre_animal}</td>
                      <td>{animal.especie_animal}</td>
                      <td>{animal.edad}</td>
                      <td>{animal.peso_animal}</td>
                      <td>{animal.via_ingreso}</td>
                      <td>{animal.observaciones_animal || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {estado === 'listo' && vista === 'historial' && (
          <div className="adoption-table-scroll">
            <table className="adoption-table">
              <caption>Adopciones registradas</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Animal</th>
                  <th scope="col">Especie</th>
                  <th scope="col">Adoptante</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Registrada por</th>
                </tr>
              </thead>
              <tbody>
                {adopciones.length === 0 ? (
                  <tr>
                    <td className="adoption-table-empty" colSpan="8">
                      Todavía no hay adopciones registradas.
                    </td>
                  </tr>
                ) : (
                  adopciones.map((adopcion) => (
                    <tr key={`${adopcion.id_animal}-${adopcion.id_adoptante}`}>
                      <td>{formatearFecha(adopcion.fecha_adopcion)}</td>
                      <td>{adopcion.animal?.nombre_animal ?? '—'}</td>
                      <td>{adopcion.animal?.especie_animal ?? '—'}</td>
                      <td>{nombreAdoptante(adopcion.adoptante)}</td>
                      <td>{adopcion.adoptante?.direccion ?? '—'}</td>
                      <td>{adopcion.adoptante?.telefono ?? '—'}</td>
                      <td>{adopcion.adoptante?.correo ?? '—'}</td>
                      <td>{adopcion.usuario?.nombre_usuario ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formularioAbierto && animalSeleccionado && (
        <AdoptionForm
          animal={animalSeleccionado}
          onClose={cerrarFormulario}
          onSaved={adopcionRegistrada}
        />
      )}
    </>
  )
}