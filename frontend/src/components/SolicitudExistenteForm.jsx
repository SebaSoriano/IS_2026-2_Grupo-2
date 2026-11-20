import { useEffect, useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { getAdoptantes, getAnimales, registrarSolicitudExistente } from '../services/api.js'
// usa los estilos del formulario de donaciones (donation-form, donation-field)
import './DonationForm.css'

// Popup "Ingresar solicitud": elige un adoptante que ya está en la base de datos
// y un animal disponible, e inicia el proceso de adopción (queda "en proceso").
export default function SolicitudExistenteForm({ onClose, onSaved }) {
  const [adoptantes, setAdoptantes] = useState([])
  const [animales, setAnimales] = useState([])
  // Lo que se eligió en cada <select> (texto, porque así lo entrega el <select>)
  const [idAdoptante, setIdAdoptante] = useState('')
  const [idAnimal, setIdAnimal] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Al abrir el popup se piden las dos listas al mismo tiempo
  useEffect(() => {
    Promise.all([getAdoptantes(), getAnimales({ estado: 'disponible' })])
      .then(([listaAdoptantes, listaAnimales]) => {
        setAdoptantes(listaAdoptantes)
        setAnimales(listaAnimales)
      })
      .catch(() => setError('No se pudieron cargar los adoptantes o los animales'))
  }, [])

  async function guardar(event) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    try {
      // El backend espera números: "5" → 5
      await registrarSolicitudExistente({
        id_adoptante: Number(idAdoptante),
        id_animal: Number(idAnimal),
      })
      onSaved()
    } catch (errorGuardar) {
      setError(errorGuardar.details?.[0]?.mensaje ?? errorGuardar.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal title="Ingresar solicitud" onClose={onClose}>
      <form className="donation-form" onSubmit={guardar}>
        <label className="donation-field">
          Adoptante
          <select value={idAdoptante} onChange={(event) => setIdAdoptante(event.target.value)} required>
            <option value="">Selecciona un adoptante</option>
            {adoptantes.map((adoptante) => (
              <option value={adoptante.id_adoptante} key={adoptante.id_adoptante}>
                {adoptante.nombre_adoptante ?? 'Sin nombre'} ({adoptante.correo})
              </option>
            ))}
          </select>
        </label>

        <label className="donation-field">
          Animal disponible
          <select value={idAnimal} onChange={(event) => setIdAnimal(event.target.value)} required>
            <option value="">Selecciona un animal</option>
            {animales.map((animal) => (
              <option value={animal.id_animal} key={animal.id_animal}>
                {animal.nombre_animal} ({animal.especie_animal}, id {animal.id_animal})
              </option>
            ))}
          </select>
        </label>

        {error && <p className="donation-form__error" role="alert">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Iniciar proceso'}
          </button>
        </div>
      </form>
    </Modal>
  )
}