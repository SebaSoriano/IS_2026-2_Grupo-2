import { useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { agendarDonacion } from '../services/api.js'
import { Campo, erroresPorCampo } from './DonationFormPartes.jsx'
import './DonationForm.css'

// primera fecha que se puede elegir: mañana, en formato AAAA-MM-DD (hora del navegador)
function fechaManana() {
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const mes = String(manana.getMonth() + 1).padStart(2, '0')
  const dia = String(manana.getDate()).padStart(2, '0')
  return `${manana.getFullYear()}-${mes}-${dia}`
}

// donacion: la fila de la tabla. onClose: cerrar sin hacer nada. onListo: se agendó, hay que recargar la tabla
export default function DonationAgendarModal({ donacion, onClose, onListo }) {
  const [fecha, setFecha] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (event) => {
    event.preventDefault()
    setEnviando(true)
    setErrores({})
    setErrorGeneral('')

    try {
      await agendarDonacion(donacion.id_donacion, fecha)
      onListo()
    } catch (error) {
      const porCampo = erroresPorCampo(error)
      setErrores(porCampo)
      if (Object.keys(porCampo).length === 0) setErrorGeneral(error.message)
      setEnviando(false)
    }
  }

  return (
    <Modal title={`Agendar donación #${donacion.id_donacion}`} onClose={onClose}>
      <form className="donation-form" onSubmit={enviar}>
        <p className="donation-form__nota">
          {donacion.donante_nombre} entregará: {donacion.descripcion_insumos}
        </p>

        <Campo etiqueta="Fecha de entrega" error={errores.fecha_agendada}>
          <input
            type="date"
            value={fecha}
            min={fechaManana()}
            onChange={(event) => setFecha(event.target.value)}
            required
            aria-invalid={Boolean(errores.fecha_agendada)}
          />
        </Campo>

        {errorGeneral && <p className="donation-form__error" role="alert">{errorGeneral}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Agendar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}