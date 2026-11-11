import { useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { eliminarDonacion } from '../services/api.js'
import './DonationForm.css'

// Pide confirmación antes de borrar una donación (solo el Admin)
export default function DonationEliminarModal({ donacion, onClose, onListo }) {
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const insumosEnInventario = donacion.insumos?.length ?? 0

  const eliminar = async () => {
    setEnviando(true)
    setError('')

    try {
      await eliminarDonacion(donacion.id_donacion)
      onListo()
    } catch (requestError) {
      setError(requestError.message)
      setEnviando(false)
    }
  }

  return (
    <Modal title={`Eliminar donación #${donacion.id_donacion}`} onClose={onClose}>
      <div className="donation-form">
        <p className="donation-form__nota">
          ¿Eliminar la donación #{donacion.id_donacion} ({donacion.tipo_donacion}
          {donacion.donante_nombre ? ` de ${donacion.donante_nombre}` : ''})? Esta acción no se puede deshacer.
        </p>

        {donacion.comprobante_url && (
          <p className="donation-form__nota">También se borra la imagen del comprobante.</p>
        )}

        {insumosEnInventario > 0 && (
          <p className="donation-form__nota">
            Los {insumosEnInventario} insumos que ya se agregaron al inventario no se eliminan; si
            corresponde, bórralos desde Inventario.
          </p>
        )}

        {error && <p className="donation-form__error" role="alert">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="modal__button modal__button--danger" onClick={eliminar} disabled={enviando}>
            {enviando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}