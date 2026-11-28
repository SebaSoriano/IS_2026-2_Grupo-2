import { useState } from 'react'
import Modal from '../../schedule/Modal.jsx'
import { confirmarDonacion, confirmarDonacionConComprobante } from '../../services/api.js'
import DonationListaInsumos from './DonationListaInsumos.jsx'
import { useListaInsumos } from './useListaInsumos.js'
import { Campo } from './DonationFormPartes.jsx'
import { errorDeArchivo } from './DonationFormValidacion.js'
import { formatoPesos, nombreDonante, requiereCaptura } from './DonationFormato.js'
import './DonationForm.css'

const Formulario = 'form'
const Entrada = 'input'

// Confirmar = "ya recibí esto".
// - insumos: se anota lo recibido y se agrega al inventario
// - monetaria web: se sube la captura de la transferencia vista desde la cuenta, y se avisa al donante por correo
export default function DonationConfirmarModal({ donacion, onClose, onListo }) {
  const esInsumos = donacion.tipo_donacion === 'insumos'
  const pideCaptura = requiereCaptura(donacion)
  const lista = useListaInsumos()
  const [archivo, setArchivo] = useState(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const elegirArchivo = (event) => {
    const elegido = event.target.files[0] ?? null
    setArchivo(elegido)
    setErrorArchivo(errorDeArchivo(elegido))
  }

  const enviar = async (event) => {
    event.preventDefault()
    setErrorGeneral('')

    if (pideCaptura) {
      const error = !archivo ? 'Adjunta la captura de la transferencia recibida' : errorDeArchivo(archivo)
      if (error) {
        setErrorArchivo(error)
        return
      }
    }

    setEnviando(true)
    try {
      if (pideCaptura) {
        const formData = new FormData()
        formData.append('comprobante', archivo)
        await confirmarDonacionConComprobante(donacion.id_donacion, formData)
      } else {
        await confirmarDonacion(donacion.id_donacion, esInsumos ? { insumos: lista.comoDatos() } : {})
      }
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
      title={`Confirmar donación de ${nombreDonante(donacion)}`}
      onClose={onClose}
      className="donation-modal-confirmar"
    >
      <Formulario className="donation-form" onSubmit={enviar}>
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
            Revisa el comprobante del donante antes de confirmar.
          </p>
        )}

        {pideCaptura && (
          <>
            <Campo
              etiqueta="Captura de la transferencia recibida"
              error={errorArchivo}
              ayuda="Pantallazo desde tu banco donde se vea el abono. Imagen JPG o PNG, máximo 5 MB."
            >
              <Entrada
                name="comprobante"
                type="file"
                accept="image/png,image/jpeg"
                onChange={elegirArchivo}
                required
                aria-invalid={Boolean(errorArchivo)}
              />
            </Campo>
            {donacion.donante_correo && (
              <p className="donation-form__nota">
                Al confirmar se le enviará un correo a {donacion.donante_correo} avisando que recibimos su donación.
              </p>
            )}
          </>
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
      </Formulario>
    </Modal>
  )
}