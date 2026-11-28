import { useState } from 'react'
import Modal from '../../schedule/Modal.jsx'
import { rechazarDonacion } from '../../services/api.js'
import { formatoPesos, nombreDonante } from './DonationFormato.js'
import './DonationForm.css'

// Pide confirmar antes de rechazar, porque el cambio es definitivo
export default function DonationRechazarModal({ donacion, onClose, onListo }) {
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const rechazar = async () => {
    setEnviando(true)
    setError('')

    try {
      await rechazarDonacion(donacion.id_donacion)
      onListo()
    } catch (requestError) {
      setError(requestError.message)
      setEnviando(false)
    }
  }

  return (
    <Modal title={`Rechazar donación de ${nombreDonante(donacion)}`} onClose={onClose}>
      <div className="donation-form">
        <p className="donation-form__nota">
          ¿Rechazar la transferencia de {formatoPesos.format(donacion.monto_donacion)}? Hazlo si el
          comprobante no corresponde o el dinero no llegó. La donación quedará como "rechazada" y no
          se podrá volver a confirmar.
        </p>

        {error && <p className="donation-form__error" role="alert">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="modal__button modal__button--danger" onClick={rechazar} disabled={enviando}>
            {enviando ? 'Rechazando...' : 'Rechazar donación'}
          </button>
        </div>
      </div>
    </Modal>
  )
}