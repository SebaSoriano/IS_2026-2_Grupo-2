import Modal from '../../schedule/Modal.jsx'
import { API_BASE_URL } from '../../services/api.js'
import {
  detalleDonacion,
  formatoDia,
  formatoFechaHora,
  nombreDonante,
  puedeAgendar,
  puedeConfirmar,
  puedeRechazar
} from './DonationFormato.js'

// una fila "etiqueta: valor" de la lista de datos
function Dato({ etiqueta, children }) {
  return (
    <>
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </>
  )
}

// Detalle completo de una donación y sus acciones.
// onAccion recibe el nombre de la acción elegida ('agendar' | 'confirmar')
export default function DonationDetalleModal({ donacion, usuario, onClose, onAccion }) {
  const esInsumos = donacion.tipo_donacion === 'insumos'
  const agendar = puedeAgendar(donacion)
  const confirmar = puedeConfirmar(donacion, usuario)
  // el navegador manda la cookie de sesión solo, por eso la imagen y el enlace funcionan
  const urlComprobante = `${API_BASE_URL}/donaciones/${donacion.id_donacion}/comprobante`

  return (
    <Modal title={`Donación de ${nombreDonante(donacion)}`} onClose={onClose} className="donation-modal-detalle">
      <dl className="donation-detalle">
        <Dato etiqueta="Tipo">{esInsumos ? 'Insumos' : 'Monetaria'}</Dato>
        <Dato etiqueta="Estado">
          <span className={`donation-badge donation-badge--${donacion.estado}`}>{donacion.estado}</span>
        </Dato>
        <Dato etiqueta="Origen">{donacion.origen}</Dato>
        <Dato etiqueta="Fecha">{formatoFechaHora(donacion.fecha_donacion)}</Dato>
        <Dato etiqueta="Donante">{nombreDonante(donacion)}</Dato>
        {donacion.donante_correo && <Dato etiqueta="Correo">{donacion.donante_correo}</Dato>}
        {donacion.donante_telefono && <Dato etiqueta="Teléfono">{donacion.donante_telefono}</Dato>}
        <Dato etiqueta="Recibida por">{donacion.usuario?.nombre_usuario ?? '—'}</Dato>

        {esInsumos ? (
          <>
            <Dato etiqueta="Detalle">{donacion.descripcion_insumos}</Dato>
            <Dato etiqueta="Agendada para">{formatoDia(donacion.fecha_agendada)}</Dato>
          </>
        ) : (
          <>
            <Dato etiqueta="Monto y método">{detalleDonacion(donacion)}</Dato>
            <Dato etiqueta="Cuenta">
              {donacion.cuenta ? `${donacion.cuenta.banco} · ${donacion.cuenta.titular_nombre}` : '—'}
            </Dato>
          </>
        )}
      </dl>

      {donacion.comprobante_url && (
        <section className="donation-detalle__seccion">
          <h3>Comprobante</h3>
          <img
            className="donation-detalle__comprobante"
            src={urlComprobante}
            alt="Comprobante de la transferencia"
          />
          <a href={urlComprobante} target="_blank" rel="noreferrer">Abrir en una pestaña nueva</a>
        </section>
      )}

      {donacion.insumos?.length > 0 && (
        <section className="donation-detalle__seccion">
          <h3>Insumos recibidos</h3>
          <ul>
            {donacion.insumos.map((insumo) => (
              <li key={insumo.id}>
                {insumo.cantidad} × {insumo.tipo_insumo}
                {insumo.descripcion && ` (${insumo.descripcion})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="modal__actions">
        <button type="button" className="modal__button" onClick={onClose}>
          Cerrar
        </button>
        {agendar && (
          <button type="button" className="modal__button" onClick={() => onAccion('agendar')}>
            Agendar
          </button>
        )}
        {confirmar && (
          <button type="button" className="modal__button modal__button--primary" onClick={() => onAccion('confirmar')}>
            {esInsumos ? 'Confirmar recepción' : 'Confirmar'}
          </button>
        )}
        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose}>
            Cerrar
          </button>
          {rechazar && (
            <button type="button" className="modal__button modal__button--danger" onClick={() => onAccion('rechazar')}>
              Rechazar
            </button>
          )}
          {agendar && (
            <button type="button" className="modal__button" onClick={() => onAccion('agendar')}>
              Agendar
            </button>
          )}
          {confirmar && (
            <button type="button" className="modal__button modal__button--primary" onClick={() => onAccion('confirmar')}>
              {esInsumos ? 'Confirmar recepción' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}