import { useEffect, useState } from 'react'
import { eliminarAnimal, getAnimales } from '../services/api.js'
import AnimalForm from './AnimalForm.jsx'
import HistorialTarjetas from './HistorialTarjetas.jsx'
import './AnimalSection.css'
// Se importa para usar los estilos de las tarjetas y de los botones Tabla/Tarjetas
import './HistorialSection.css'
import { usePermisos } from '../sesion/sesion.js'

export default function AnimalSection() {
  // todos los roles ven "Añadir Animal" (puedeAgregar);
  // "Modificar" y "Eliminar" solo los ven Admin y Veterinaria (puedeEditar), el Voluntario no
  const { puedeAgregar, puedeEditar } = usePermisos()
  const [animales, setAnimales] = useState([])
  // Estado de la carga: 'cargando', 'listo' o 'error'
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  // id del animal seleccionado (null = ninguno)
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  // Qué popup está abierto: null (ninguno), 'crear' o 'modificar'
  const [formularioAbierto, setFormularioAbierto] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  // Cómo se muestran los animales: 'tabla' o 'tarjetas'
  const [vista, setVista] = useState('tabla')

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

  const animalSeleccionado =
    animales.find((animal) => animal.id_animal === seleccionadoId) ?? null

  // Si se aprieta el animal que ya estaba seleccionado, se deselecciona;
  // si se aprieta otro, se selecciona ese
  function alternarSeleccion(id) {
    if (seleccionadoId === id) {
      setSeleccionadoId(null)
    } else {
      setSeleccionadoId(id)
    }
  }

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
  function animalGuardado(animal, avisoFoto) {
    if (formularioAbierto === 'crear') {
      setAnimales([{ ...animal, adoptado: false, adopcion: null }, ...animales])
      setMensaje({ tipo: 'exito', texto: `Animal registrado con el id ${animal.id_animal}` })
    } else {
      setAnimales(
        animales.map((actual) =>
          actual.id_animal === animal.id_animal ? { ...actual, ...animal } : actual,
        ),
      )
      setMensaje({ tipo: 'exito', texto: `Animal ${animal.id_animal} modificado` })
    }

    // Si el animal se guardó pero la foto falló, se avisa
    if (avisoFoto) {
      setMensaje({
        tipo: 'error',
        texto: `El animal se guardó, pero la foto no se pudo subir: ${avisoFoto}`,
      })
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
        {puedeAgregar && (
          <button className="area-action" type="button" onClick={abrirCrear}>
            Añadir Animal
          </button>
        )}
        {puedeEditar && (
          <>
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
                Selecciona un animal para modificarlo o eliminarlo. Apriétalo otra vez
                para deseleccionarlo.
              </p>
            )}
          </>
        )}
      </div>

      <div className="animal-table-container" aria-busy={estado === 'cargando'}>
        {/* Botones Tabla / Tarjetas con las mismas clases de Historial médico.
            El div de afuera es flex para que "margin-left: auto" los mande a la derecha */}
        <div style={{ display: 'flex', marginBottom: '12px' }}>
          <div className="historial-filtros__vistas" role="group" aria-label="Tipo de vista">
            <button
              className="historial-filtros__vista"
              type="button"
              aria-pressed={vista === 'tabla'}
              onClick={() => setVista('tabla')}
            >
              ☰ Tabla
            </button>
            <button
              className="historial-filtros__vista"
              type="button"
              aria-pressed={vista === 'tarjetas'}
              onClick={() => setVista('tarjetas')}
            >
              ▦ Tarjetas
            </button>
          </div>
        </div>

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

        {estado === 'listo' && vista === 'tarjetas' && (
          <HistorialTarjetas
            animales={animales}
            seleccionadoId={seleccionadoId}
            onElegirAnimal={(animal) => alternarSeleccion(animal.id_animal)}
          />
        )}

        {estado === 'listo' && vista === 'tabla' && (
          <div className="animal-table-scroll">
            <table className="animal-table">
              <caption>Animales registrados</caption>
              <thead>
                <tr>
                  <th scope="col">Seleccionar</th>
                  <th scope="col">Foto</th>
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
                    <td className="animal-table-empty" colSpan="10">
                      No hay animales registrados.
                    </td>
                  </tr>
                ) : (
                  animales.map((animal) => (
                    <tr
                      key={animal.id_animal}
                      className={animal.id_animal === seleccionadoId ? 'is-selected' : ''}
                      onClick={() => alternarSeleccion(animal.id_animal)}
                    >
                      <td>
                        {/* checkbox en vez de radio: un radio no se puede desmarcar */}
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar animal ${animal.id_animal}`}
                          checked={animal.id_animal === seleccionadoId}
                          onChange={() => alternarSeleccion(animal.id_animal)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>
                      <td>
                        {animal.foto_animal ? (
                          <img
                            className="animal-table__foto"
                            src={animal.foto_animal}
                            alt={`Foto de ${animal.nombre_animal}`}
                          />
                        ) : (
                          '—'
                        )}
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