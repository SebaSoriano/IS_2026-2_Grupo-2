import { useState } from 'react'
import Modal from '../../schedule/Modal.jsx'
import { eliminarFotoAnimal } from '../../services/api.js'
import './AnimalCarrusel.css'

// Popup con las fotos de un animal: una foto grande, flechas para avanzar/retroceder,
// miniaturas para saltar a una foto y (solo Admin y Veterinaria) un botón para eliminarla.
export default function AnimalCarrusel({ animal, puedeEliminar, onClose, onFotoEliminada }) {
  const fotos = animal.fotos ?? []
  // Posición de la foto que se está mirando (0 = la primera)
  const [indice, setIndice] = useState(0)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  // Si se elimina la última foto de la lista, el índice quedaría fuera: se ajusta al último que existe
  const actual = Math.min(indice, fotos.length - 1)
  const foto = fotos[actual]

  // Al llegar al final vuelve al principio (y al revés), como un carrusel
  function anterior() {
    setIndice(actual === 0 ? fotos.length - 1 : actual - 1)
  }

  function siguiente() {
    setIndice(actual === fotos.length - 1 ? 0 : actual + 1)
  }

  async function eliminar() {
    const confirmado = window.confirm('¿Eliminar esta foto? No se puede deshacer.')
    if (!confirmado) return

    setEliminando(true)
    setError('')
    try {
      // El backend devuelve el animal con sus fotos actualizadas
      const animalActualizado = await eliminarFotoAnimal(animal.id_animal, foto.id_foto)
      // AnimalSection reemplaza el animal en la lista; este componente recibe las fotos nuevas por props
      onFotoEliminada(animalActualizado)
    } catch (errorEliminar) {
      setError(errorEliminar.message)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <Modal title={`Fotos de ${animal.nombre_animal}`} onClose={onClose} className="animal-carrusel-modal">
      {fotos.length === 0 ? (
        <p className="animal-carrusel__vacio">
          Este animal todavía no tiene fotos. Puedes agregarlas con "Modificar Animal".
        </p>
      ) : (
        <div className="animal-carrusel">
          <div className="animal-carrusel__visor">
            <button
              className="animal-carrusel__flecha animal-carrusel__flecha--anterior"
              type="button"
              onClick={anterior}
              disabled={fotos.length < 2}
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <img
              className="animal-carrusel__foto"
              src={foto.ruta}
              alt={`Foto ${actual + 1} de ${animal.nombre_animal}`}
            />
            <button
              className="animal-carrusel__flecha animal-carrusel__flecha--siguiente"
              type="button"
              onClick={siguiente}
              disabled={fotos.length < 2}
              aria-label="Foto siguiente"
            >
              ›
            </button>
            {/* La portada es la foto que se ve en la tabla, en las tarjetas y en la página pública */}
            {foto.ruta === animal.foto_animal && (
              <span className="animal-carrusel__portada">Portada</span>
            )}
          </div>

          <p className="animal-carrusel__contador">
            {actual + 1} / {fotos.length}
          </p>

          <div className="animal-carrusel__miniaturas">
            {fotos.map((miniatura, posicion) => (
              <button
                className="animal-carrusel__miniatura"
                type="button"
                key={miniatura.id_foto}
                aria-pressed={posicion === actual}
                aria-label={`Ver foto ${posicion + 1}`}
                onClick={() => setIndice(posicion)}
              >
                <img src={miniatura.ruta} alt="" />
              </button>
            ))}
          </div>

          {error && (
            <p className="animal-carrusel__error" role="alert">
              {error}
            </p>
          )}

          {puedeEliminar && (
            <div className="modal__actions">
              <button
                className="modal__button modal__button--danger"
                type="button"
                onClick={eliminar}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar esta foto'}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}