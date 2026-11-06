import { useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { crearDonacionWeb } from '../services/api.js'
import { Campo, CamposDonante, erroresPorCampo, sinVacios } from './DonationFormPartes.jsx'
import './DonationForm.css'

const INICIAL = {
  descripcion_insumos: '',
  donante_nombre: '',
  donante_correo: '',
  donante_telefono: '',
}

export default function DonationInsumosForm({ onVolver, onClose }) {
  const [valores, setValores] = useState(INICIAL)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)

  // un solo manejador para todos los campos: usa el "name" del input como clave
  const cambiar = (event) => {
    const { name, value } = event.target
    setValores((actuales) => ({ ...actuales, [name]: value }))
  }

  const enviar = async (event) => {
    event.preventDefault()
    setEnviando(true)
    setErrores({})
    setErrorGeneral('')

    try {
      await crearDonacionWeb(sinVacios({ ...valores, tipo_donacion: 'insumos' }))
      setEnviada(true)
    } catch (error) {
      const porCampo = erroresPorCampo(error)
      setErrores(porCampo)
      // sin errores por campo es un problema general (servidor caído, etc.)
      if (Object.keys(porCampo).length === 0) setErrorGeneral(error.message)
    } finally {
      setEnviando(false)
    }
  }

  if (enviada) {
    return (
      <Modal title="¡Gracias por ayudar!" onClose={onClose}>
        <p>
          Recibimos tu donación de insumos. Un voluntario se pondrá en contacto contigo
          para acordar la hora de entrega.
        </p>
        <div className="modal__actions">
          <button type="button" className="modal__button modal__button--primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Donar insumos" onClose={onClose}>
      <form className="donation-form" onSubmit={enviar}>
        <Campo
          etiqueta="¿Qué insumos vas a donar?"
          error={errores.descripcion_insumos}
          ayuda="Indica el tipo y la cantidad aproximada. Ej: 2 sacos de alimento para perros de 15 kg."
        >
          <textarea
            name="descripcion_insumos"
            value={valores.descripcion_insumos}
            onChange={cambiar}
            maxLength={500}
            rows={4}
            required
            aria-invalid={Boolean(errores.descripcion_insumos)}
          />
        </Campo>

        <CamposDonante valores={valores} errores={errores} onChange={cambiar} />

        <p className="donation-form__nota">
          La hora de entrega se acuerda con los voluntarios después de enviar este formulario.
        </p>
        {errorGeneral && <p className="donation-form__error" role="alert">{errorGeneral}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onVolver} disabled={enviando}>
            Volver
          </button>
          <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}