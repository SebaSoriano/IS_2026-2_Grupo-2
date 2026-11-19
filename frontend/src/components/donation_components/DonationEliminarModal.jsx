import { useState } from 'react'
import Modal from '../../schedule/Modal.jsx'
import { eliminarDonacion } from '../../services/api.js'
import './DonationForm.css'
import { formatoFechaHora } from './DonationFormato.js'
// Pide confirmación antes de borrar una o varias donaciones (solo el Admin)
export default function DonationEliminarModal({ donaciones, onClose, onListo }) {
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  // si algunas se borraron y otras fallaron, al cerrar hay que refrescar la tabla
  const [huboBorradas, setHuboBorradas] = useState(false)

  const total = donaciones.length
  const conComprobante = donaciones.filter((d) => d.comprobante_url).length
  const insumosEnInventario = donaciones.reduce((suma, d) => suma + (d.insumos?.length ?? 0), 0)

  const eliminar = async () => {
    setEnviando(true)
    setError('')

    const resultados = await Promise.allSettled(donaciones.map((d) => eliminarDonacion(d.id_donacion)))
    const fallidas = resultados.filter((r) => r.status === 'rejected')

    if (fallidas.length === 0) {
      onListo()
      return
    }

    if (fallidas.length < total) setHuboBorradas(true)
    const mensajes = [...new Set(fallidas.map((r) => r.reason.message))]
    setError(`No se pudieron eliminar ${fallidas.length} de ${total} donaciones: ${mensajes.join(' ')}`)
    setEnviando(false)
  }

  const cerrar = () => (huboBorradas ? onListo() : onClose())

  return (
    <Modal
      title={total === 1 ? `Eliminar donación de ${nombreDonante(donaciones[0])}` : 'Eliminar donaciones'}
      onClose={cerrar}
    >
      <div className="donation-form">
        <p className="donation-form__nota">
          {total === 1
            ? `¿Eliminar la donación ${donaciones[0].tipo_donacion === 'monetaria' ? 'monetaria' : 'de insumos'} de ${nombreDonante(donaciones[0])}?`
            : `¿Eliminar las ${total} donaciones seleccionadas?`}{' '}
          Esta acción no se puede deshacer.
        </p>

        {total > 1 && (
          <ul>
            {donaciones.map((d) => (
              <li key={d.id_donacion}>{nombreDonante(d)} · {formatoFechaHora(d.fecha_donacion)}</li>
            ))}
          </ul>
        )}

        {conComprobante > 0 && (
          <p className="donation-form__nota">
            {conComprobante === 1 ? 'También se borra la imagen del comprobante.' : `También se borran las ${conComprobante} imágenes de comprobante.`}
          </p>
        )}

        {insumosEnInventario > 0 && (
          <p className="donation-form__nota">
            Los {insumosEnInventario} insumos que ya se agregaron al inventario no se eliminan; si
            corresponde, bórralos desde Inventario.
          </p>
        )}

        {error && <p className="donation-form__error" role="alert">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={cerrar} disabled={enviando}>
            {huboBorradas ? 'Cerrar' : 'Cancelar'}
          </button>
          {!huboBorradas && (
            <button type="button" className="modal__button modal__button--danger" onClick={eliminar} disabled={enviando}>
              {enviando ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}