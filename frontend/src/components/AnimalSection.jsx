import { useEffect, useState } from 'react'
import { eliminarAnimal, getAnimales } from '../services/api.js'
import AnimalForm from './AnimalForm.jsx'
import './AnimalSection.css'

export default function AnimalSection() {
  // Lista de animales que viene del backend
  const [animales, setAnimales] = useState([])
  // Estado de la carga: 'cargando', 'listo' o 'error'
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  // id del animal seleccionado en la tabla (null = ninguno)
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  // Qué popup está abierto: null (ninguno), 'crear' o 'modificar'
  const [formularioAbierto, setFormularioAbierto] = useState(null)
  // Mensaje de éxito o error sobre la tabla
  const [mensaje, setMensaje] = useState(null)

  // Cargar los animales una vez, al entrar a la pestaña
  useEffect(() => {
    getAnimales()
      .then((lista) => {
        setAnimales(lista)
        setEstado('listo')
      })
      .catch((error) => {
        setErrorCarga(error.message)
        setEstado('error')
      })
  }, [])

  // Buscar en la lista el animal que tiene el id seleccionado
  const animalSeleccionado =
    animales.find((animal) => animal.id_animal === seleccionadoId) ?? null

  function abrirCrear() {
    setMensaje(null)
    setFormularioAbierto('crear')
  }

  function abrirModificar() {
    setMensaje(null)
    setFormularioAbierto('modificar')
  }

  function cerrarFormulario() {
    setFormularioAbierto(null)
  }

  // AnimalForm llama a esta función cuando el backend guardó el animal
  function animalGuardado(animal) {
    if (formularioAbierto === 'crear') {
      // Agregar el nuevo animal al principio de la lista
      setAnimales([{ ...animal, adoptado: false, adopcion: null }, ...animales])
      setMensaje({ tipo: 'exito', texto: `Animal registrado con el id ${animal.id_animal}` })
    } else {
      // Reemplazar en la lista el animal modificado
      setAnimales(
        animales.map((actual) =>
          actual.id_animal === animal.id_animal ? { ...actual, ...animal } : actual,
        ),
      )
      setMensaje({ tipo: 'exito', texto: `Animal ${animal.id_animal} modificado` })
    }
    setFormularioAbierto(null)
  }

  async function eliminarSeleccionado() {
    if (!animalSeleccionado) return

    const confirmado = window.confirm(
      `¿Eliminar el animal ${animalSeleccionado.id_animal} (${animalSeleccionado.especie_animal})?`,
    )
    if (!confirmado) return

    setMensaje(null)
    try {
      await eliminarAnimal(animalSeleccionado.id_animal)
      // Quitarlo de la lista
      setAnimales(
        animales.filter((animal) => animal.id_animal !== animalSeleccionado.id_animal),
      )
      setSeleccionadoId(null)
      setMensaje({ tipo: 'exito', texto: 'Animal eliminado' })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    }
  }

  return (
    <>
      <div
        className="area-actions area-actions--animales"
        role="group"
        aria-label="Acciones de animales"
      >
        <button className="area-action" type="button" onClick={abrirCrear}>
          Añadir Animal
        </button>
        <button
          className="area-action"
          type="button"
          onClick={abrirModificar}
          disabled={!animalSeleccionado}
        >
          Modificar Animal
        </button>
        <button
          className="area-action"
          type="button"
          onClick={eliminarSeleccionado}
          disabled={!animalSeleccionado}
        >
          Eliminar Animal
        </button>
        {!animalSeleccionado && (
          <p className="animal-actions-help">
            Selecciona un animal en la tabla para modificarlo o eliminarlo.
          </p>
        )}
      </div>

      <div className="animal-table-container" aria-busy={estado === 'cargando'}>
        {mensaje && (
          <p className={`animal-message animal-message--${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </p>
        )}
        {estado === 'cargando' && <p role="status">Cargando animales...</p>}
        {estado === 'error' && (
          <p className="animal-message animal-message--error" role="alert">
            No se pudieron cargar los animales: {errorCarga}
          </p>
        )}
        {estado === 'listo' && (
          <div className="animal-table-scroll">
            <table className="animal-table">
              <caption>Animales registrados</caption>
              <thead>
                <tr>
                  <th scope="col">Seleccionar</th>
                  <th scope="col">ID</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Especie</th>
                  <th scope="col">Vía de ingreso</th>
                  <th scope="col">Edad</th>
                  <th scope="col">Peso (kg)</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {animales.length === 0 ? (
                  <tr>
                    <td className="animal-table-empty" colSpan="9">
                      No hay animales registrados.
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
                            name="animal-seleccionado"
                            aria-label={`Seleccionar animal ${animal.id_animal}`}
                            checked={animal.id_animal === seleccionadoId}
                            onChange={() => setSeleccionadoId(animal.id_animal)}
                            />
                        </td>
                        <td>{animal.id_animal}</td>
                        <td>{animal.nombre_animal || '—'}</td>
                        <td>{animal.especie_animal}</td>
                        <td>{animal.via_ingreso}</td>
                        <td>{animal.edad}</td>
                        <td>{animal.peso_animal}</td>
                        <td>{animal.adoptado ? 'Adoptado' : 'Disponible'}</td>
                        <td>{animal.observaciones_animal || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formularioAbierto && (
        <AnimalForm
          animal={formularioAbierto === 'modificar' ? animalSeleccionado : null}
          onClose={cerrarFormulario}
          onSaved={animalGuardado}
        />
      )}
    </>
  )
}