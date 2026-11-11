import { useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { confirmarDonacion } from '../services/api.js'
import DonationListaInsumos from './DonationListaInsumos.jsx'
import { useListaInsumos } from './useListaInsumos.js'
import './DonationForm.css'

const formatoPesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

// Confirmar = "ya recibí esto". En monetaria basta con confirmar;
// en insumos hay que anotar qué se recibió, y eso se agrega al inventario
export default function DonationConfirmarModal({ donacion, onClose, onListo }) {
  const esInsumos = donacion.tipo_donacion === 'insumos'
  const lista = useListaInsumos()
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (event) => {
    event.preventDefault()
    setEnviando(true)
    setErrorGeneral('')

    const datos = esInsumos ? { insumos: lista.comoDatos() } : {}

    try {
      await confirmarDonacion(donacion.id_donacion, datos)
      onListo()
    } catch (error) {
      // el servidor puede devolver varios errores de campo: se muestran todos juntos
      const detalles = (error.details ?? []).map(({ campo, mensaje }) => `${campo}: ${mensaje}`)
      setErrorGeneral(detalles.length > 0 ? detalles.join(' · ') : error.message)
      setEnviando(false)
    }
  }

  return (
    <Modal
      title={`Confirmar donación #${donacion.id_donacion}`}
      onClose={onClose}
      className="donation-modal-confirmar"
    >
      <form className="donation-form" onSubmit={enviar}>
        {esInsumos ? (
          <>
            <p className="donation-form__nota">
              El donante indicó: {donacion.descripcion_insumos}. Anota lo que realmente recibiste;
              se agregará al inventario con la fecha de hoy.
            </p>
            <DonationListaInsumos lista={lista} />
          </>
        ) : (
          <p className="donation-form__nota">
            ¿Confirmas que recibiste la transferencia de {formatoPesos.format(donacion.monto_donacion)}
            {donacion.cuenta && ` en la cuenta de ${donacion.cuenta.titular_nombre} (${donacion.cuenta.banco})`}?
            Revisa el comprobante antes de confirmar.
          </p>
        )}

        {errorGeneral && <p className="donation-form__error" role="alert">{errorGeneral}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
            {enviando ? 'Confirmando...' : 'Confirmar recepción'}
          </button>
        </div>
      </form>
    </Modal>
  )
}