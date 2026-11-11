import { useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { actualizarDonacion } from '../services/api.js'
import { Campo, erroresPorCampo } from './DonationFormPartes.jsx'
import './DonationForm.css'

// Campos que tienen su propio aviso de error; cualquier otro error va en un aviso general
const CAMPOS_CON_AVISO = [
  'monto_donacion',
  'metodo_pago',
  'descripcion_insumos',
  'donante_nombre',
  'donante_correo',
  'donante_telefono',
]

const CAMPOS_DONANTE = ['donante_nombre', 'donante_correo', 'donante_telefono']

// Corrige los datos de una donación (solo el Admin). El tipo no se puede cambiar:
// si se registró del tipo equivocado, se elimina y se registra de nuevo
export default function DonationEditarModal({ donacion, onClose, onListo }) {
  const esMonetaria = donacion.tipo_donacion === 'monetaria'
  // por la web solo se aceptan transferencias, así que ahí el método no se toca
  const puedeCambiarMetodo = esMonetaria && donacion.origen === 'presencial'

  // lo que tiene guardado hoy; sirve de punto de partida y para saber qué cambió
  const inicial = {
    monto_donacion: String(donacion.monto_donacion ?? ''),
    metodo_pago: donacion.metodo_pago ?? '',
    descripcion_insumos: donacion.descripcion_insumos ?? '',
    donante_nombre: donacion.donante_nombre ?? '',
    donante_correo: donacion.donante_correo ?? '',
    donante_telefono: donacion.donante_telefono ?? '',
  }

  const [valores, setValores] = useState(inicial)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (event) => {
    const { name, value } = event.target
    setValores((actuales) => ({ ...actuales, [name]: value }))
  }

  const enviar = async (event) => {
    event.preventDefault()
    setErrores({})
    setErrorGeneral('')

    // El servidor no permite dejar un dato del donante en blanco: se avisa antes de enviar
    const vaciados = CAMPOS_DONANTE.filter((campo) => inicial[campo] !== '' && valores[campo].trim() === '')
    if (vaciados.length > 0) {
      setErrores(Object.fromEntries(vaciados.map((campo) => [campo, 'No puede quedar vacío'])))
      return
    }

    // Solo se envía lo que cambió
    const cambios = {}
    if (esMonetaria) {
      if (valores.monto_donacion !== inicial.monto_donacion) cambios.monto_donacion = Number(valores.monto_donacion)
      if (puedeCambiarMetodo && valores.metodo_pago !== inicial.metodo_pago) cambios.metodo_pago = valores.metodo_pago
    } else if (valores.descripcion_insumos !== inicial.descripcion_insumos) {
      cambios.descripcion_insumos = valores.descripcion_insumos
    }
    for (const campo of CAMPOS_DONANTE) {
      if (valores[campo] !== inicial[campo]) cambios[campo] = valores[campo]
    }

    if (Object.keys(cambios).length === 0) {
      setErrorGeneral('No hiciste ningún cambio')
      return
    }

    setEnviando(true)
    try {
      await actualizarDonacion(donacion.id_donacion, cambios)
      onListo()
    } catch (error) {
      const detalles = error.details ?? []
      setErrores(erroresPorCampo(error))
      const otros = detalles
        .filter(({ campo }) => !CAMPOS_CON_AVISO.includes(campo))
        .map(({ campo, mensaje }) => `${campo}: ${mensaje}`)
      if (otros.length > 0) setErrorGeneral(otros.join(' · '))
      else if (detalles.length === 0) setErrorGeneral(error.message)
      setEnviando(false)
    }
  }

  return (
    <Modal title={`Editar donación #${donacion.id_donacion}`} onClose={onClose}>
      <form className="donation-form" onSubmit={enviar}>
        {!esMonetaria && donacion.insumos?.length > 0 && (
          <p className="donation-form__nota">
            Los insumos que ya se agregaron al inventario no cambian desde aquí; se corrigen en Inventario.
          </p>
        )}

        {esMonetaria ? (
          <>
            <Campo etiqueta="Monto (CLP)" error={errores.monto_donacion}>
              <input
                name="monto_donacion"
                type="number"
                min="1"
                max="100000000"
                step="1"
                value={valores.monto_donacion}
                onChange={cambiar}
                required
                aria-invalid={Boolean(errores.monto_donacion)}
              />
            </Campo>

            {puedeCambiarMetodo && (
              <Campo etiqueta="Método de pago" error={errores.metodo_pago}>
                <select name="metodo_pago" value={valores.metodo_pago} onChange={cambiar}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </Campo>
            )}
          </>
        ) : (
          <Campo etiqueta="Descripción de lo donado" error={errores.descripcion_insumos}>
            <textarea
              name="descripcion_insumos"
              value={valores.descripcion_insumos}
              onChange={cambiar}
              maxLength={500}
              rows={3}
              required
              aria-invalid={Boolean(errores.descripcion_insumos)}
            />
          </Campo>
        )}

        <Campo etiqueta="Nombre del donante" error={errores.donante_nombre}>
          <input
            name="donante_nombre"
            value={valores.donante_nombre}
            onChange={cambiar}
            maxLength={100}
            aria-invalid={Boolean(errores.donante_nombre)}
          />
        </Campo>

        <Campo etiqueta="Correo del donante" error={errores.donante_correo}>
          <input
            name="donante_correo"
            type="email"
            value={valores.donante_correo}
            onChange={cambiar}
            maxLength={100}
            aria-invalid={Boolean(errores.donante_correo)}
          />
        </Campo>

        <Campo etiqueta="Teléfono del donante" error={errores.donante_telefono} ayuda="Ejemplo: +56912345678">
          <input
            name="donante_telefono"
            type="tel"
            value={valores.donante_telefono}
            onChange={cambiar}
            aria-invalid={Boolean(errores.donante_telefono)}
          />
        </Campo>

        {errorGeneral && <p className="donation-form__error" role="alert">{errorGeneral}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}