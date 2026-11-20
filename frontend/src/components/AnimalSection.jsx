import { useEffect, useState } from 'react'
import { eliminarAnimal, getAnimales } from '../services/api.js'
import AnimalForm from './AnimalForm.jsx'
import AnimalFiltros from './AnimalFiltros.jsx'
import AnimalCarrusel from './AnimalCarrusel.jsx'
import HistorialTarjetas from './historialMedico/HistorialTarjetas.jsx'
import './AnimalSection.css'
// Se importa para usar los estilos de las tarjetas y de los botones Tabla/Tarjetas
import './historialMedico/HistorialSection.css'
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

  // Filtros aplicados con "Buscar" ({} = sin filtros)
  const [filtros, setFiltros] = useState({})
  // true = el popup del carrusel de fotos está abierto
  const [carruselAbierto, setCarruselAbierto] = useState(false)

  // Pedir los animales al entrar a la pestaña y cada vez que cambian los filtros.
  // "cancelado" evita que una respuesta vieja pise a una nueva si se busca dos veces seguidas
  // (al cambiar los filtros, React ejecuta el return de la búsqueda anterior)
  useEffect(() => {
    let cancelado = false

    getAnimales(filtros)
      .then((lista) => {
        if (cancelado) return
        setAnimales(lista)
        setEstado('listo')
      })
      .catch((error) => {
        if (cancelado) return
        setErrorCarga(error.message)
        setEstado('error')
      })

    return () => {
      cancelado = true
    }
  }, [filtros])

  // Lo llama AnimalFiltros al apretar "Buscar" o "Limpiar filtros"
  function buscar(nuevosFiltros) {
    setFiltros(nuevosFiltros)
    setSeleccionadoId(null)
    setMensaje(null)
  }

  // ¿Hay algún filtro con valor? Sirve para elegir el mensaje cuando la lista sale vacía
  const hayFiltros = Object.values(filtros).some((valor) => valor !== '')

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
  
  // AnimalCarrusel llama a esta función después de eliminar una foto:
  // se reemplaza el animal en la lista para que la tabla y el carrusel muestren las fotos que quedan
  function fotoEliminada(animal) {
    setAnimales(
      animales.map((actual) =>
        actual.id_animal === animal.id_animal ? { ...actual, ...animal } : actual,
      ),
    )
    setMensaje({ tipo: 'exito', texto: 'Foto eliminada' })
  }

  // AnimalForm llama a esta función cuando el backend guardó el animal
  function animalGuardado(animal, avisoFoto) {
    if (formularioAbierto === 'crear') {
      // fotos: [] va primero: si el backend devolvió fotos, las de "animal" la reemplazan
      setAnimales([{ fotos: [], ...animal, adoptado: false, adopcion: null }, ...animales])
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
        {/* Ver las fotos lo puede hacer cualquier rol; eliminarlas solo Admin y Veterinaria */}
        <button
          className="area-action"
          type="button"
          onClick={() => setCarruselAbierto(true)}
          disabled={!animalSeleccionado}
        >
          Ver Fotos
        </button>
      </div>

      <div className="animal-table-container" aria-busy={estado === 'cargando'}>
        {/* Barra de filtros; también trae los botones Tabla / Tarjetas */}
        <AnimalFiltros onBuscar={buscar} vista={vista} onCambiarVista={setVista} />

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
                      {hayFiltros
                        ? 'No hay animales que coincidan con los filtros.'
                        : 'No hay animales registrados.'}
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
            {carruselAbierto && animalSeleccionado && (
        <AnimalCarrusel
          animal={animalSeleccionado}
          puedeEliminar={puedeEditar}
          onClose={() => setCarruselAbierto(false)}
          onFotoEliminada={fotoEliminada}
        />
      )}
    </>
  )
}