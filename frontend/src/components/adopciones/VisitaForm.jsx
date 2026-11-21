import { useState } from 'react'
import Modal from '../../schedule/Modal.jsx'
import { agendarVisita } from '../../services/api.js'
// usa los estilos del formulario de donaciones (donation-form, donation-field)
import '../DonationForm.css'

// Convierte una fecha al formato del <input type="datetime-local">: "AAAA-MM-DDTHH:MM"
function formatoInput(fecha) {
  const dosDigitos = (numero) => String(numero).padStart(2, '0')
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}

// Popup para elegir la fecha y hora de la visita de una solicitud
export default function VisitaForm({ solicitud, onClose, onSaved }) {
  // Si ya tenía visita, se muestra esa fecha para poder cambiarla
  const [fechaVisita, setFechaVisita] = useState(
    solicitud.fecha_visita ? formatoInput(new Date(solicitud.fecha_visita)) : '',
  )
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function guardar(event) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await agendarVisita(solicitud.id_solicitud, fechaVisita)
      onSaved()
    } catch (errorGuardar) {
      // Si es un error de validación, se muestra el mensaje del campo
      setError(errorGuardar.details?.[0]?.mensaje ?? errorGuardar.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal title="Agendar visita" onClose={onClose}>
      <form className="donation-form" onSubmit={guardar}>
        <p>
          <strong>{solicitud.adoptante.nombre_adoptante ?? 'Adoptante'}</strong> quiere adoptar a{' '}
          <strong>{solicitud.animal.nombre_animal}</strong>. Al agendar la visita, el animal
          queda <strong>en proceso de adopción</strong>.
        </p>

        <label className="donation-field">
          Fecha y hora de la visita
          <input
            type="datetime-local"
            value={fechaVisita}
            onChange={(event) => setFechaVisita(event.target.value)}
            min={formatoInput(new Date())}
            required
          />
        </label>

        {error && <p className="donation-form__error" role="alert">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Agendar visita'}
          </button>
        </div>
      </form>
    </Modal>
  )
}