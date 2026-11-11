import { useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { confirmarDonacion } from '../services/api.js'
import { Campo, sinVacios } from './DonationFormPartes.jsx'
import './DonationForm.css'

const TIPOS_INSUMO = [
  'Alimentación',
  'Higiene y aseo',
  'Salud',
  'Limpieza',
  'Accesorios y juguetes',
  'Otros',
]

const MAXIMO_FILAS = 30 // el servidor no acepta más de 30 insumos por donación
// cada fila lleva un id propio para que React no confunda las filas al quitar una del medio
let contadorFilas = 0
const nuevaFila = () => ({ id: ++contadorFilas, tipo_insumo: '', cantidad: '', descripcion: '', fecha_vencimiento: '' })

const formatoPesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

// Confirmar = "ya recibí esto". En monetaria basta con confirmar;
// en insumos hay que anotar qué se recibió, y eso se agrega al inventario
export default function DonationConfirmarModal({ donacion, onClose, onListo }) {
  const esInsumos = donacion.tipo_donacion === 'insumos'
  const [filas, setFilas] = useState(() => [nuevaFila()])
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // copia la lista cambiando solo la fila y el campo indicados
  const cambiarFila = (indice, campo, valor) =>
    setFilas((actuales) => actuales.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)))

  const agregarFila = () =>
    setFilas((actuales) => (actuales.length < MAXIMO_FILAS ? [...actuales, nuevaFila()] : actuales))

  const quitarFila = (indice) => setFilas((actuales) => actuales.filter((_, i) => i !== indice))

  const enviar = async (event) => {
    event.preventDefault()
    setEnviando(true)
    setErrorGeneral('')

    // sinVacios saca la descripción y el vencimiento si se dejaron en blanco (son opcionales)
    const datos = esInsumos
      ? {
          insumos: filas.map((fila) => ({
            ...sinVacios({
              tipo_insumo: fila.tipo_insumo,
              descripcion: fila.descripcion,
              fecha_vencimiento: fila.fecha_vencimiento,
            }),
            cantidad: Number(fila.cantidad),
          })),
        }
      : {}

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

            {filas.map((fila, indice) => (
              <fieldset className="donation-insumo" key={fila.id}>
                <legend>Insumo {indice + 1}</legend>

                <Campo etiqueta="Tipo">
                  <select
                    value={fila.tipo_insumo}
                    onChange={(event) => cambiarFila(indice, 'tipo_insumo', event.target.value)}
                    required
                  >
                    <option value="">Elige un tipo</option>
                    {TIPOS_INSUMO.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </Campo>

                <Campo etiqueta="Cantidad">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    step="1"
                    value={fila.cantidad}
                    onChange={(event) => cambiarFila(indice, 'cantidad', event.target.value)}
                    required
                  />
                </Campo>

                <Campo etiqueta="Descripción (opcional)">
                  <input
                    value={fila.descripcion}
                    maxLength={255}
                    onChange={(event) => cambiarFila(indice, 'descripcion', event.target.value)}
                  />
                </Campo>

                <Campo etiqueta="Vencimiento (opcional)">
                  <input
                    type="date"
                    value={fila.fecha_vencimiento}
                    onChange={(event) => cambiarFila(indice, 'fecha_vencimiento', event.target.value)}
                  />
                </Campo>

                {filas.length > 1 && (
                  <button type="button" className="modal__button modal__button--danger" onClick={() => quitarFila(indice)}>
                    Quitar
                  </button>
                )}
              </fieldset>
            ))}

            <button type="button" className="modal__button" onClick={agregarFila} disabled={filas.length >= MAXIMO_FILAS}>
              + Agregar otro insumo
            </button>
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