import { useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { crearDonacionPresencial } from '../services/api.js'
import { Campo, erroresPorCampo, sinVacios } from './DonationFormPartes.jsx'
import DonationListaInsumos from './DonationListaInsumos.jsx'
import { useListaInsumos } from './useListaInsumos.js'
import './DonationForm.css'

const INICIAL = {
  monto_donacion: '',
  metodo_pago: 'efectivo',
  donante_nombre: '',
  donante_correo: '',
  donante_telefono: '',
}

// Campos que tienen su propio aviso de error; cualquier otro error va en un aviso general
const CAMPOS_CON_AVISO = ['monto_donacion', 'metodo_pago', 'donante_nombre', 'donante_correo', 'donante_telefono']

// El servidor pide un resumen de lo donado, se arma solo con la lista: "3 Alimentación (sacos), 2 Salud"
function resumenDeInsumos(insumos) {
  return insumos
    .map(({ cantidad, tipo_insumo, descripcion }) => `${cantidad} ${tipo_insumo}${descripcion ? ` (${descripcion})` : ''}`)
    .join(', ')
    .slice(0, 500)
}

// Registro de una donación que llegó en persona. Nace "confirmada" y queda a nombre de quien la registra
export default function DonationPresencialForm({ onClose, onListo }) {
  const [tipo, setTipo] = useState('monetaria')
  const [valores, setValores] = useState(INICIAL)
  const lista = useListaInsumos()
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (event) => {
    const { name, value } = event.target
    setValores((actuales) => ({ ...actuales, [name]: value }))
  }

  const enviar = async (event) => {
    event.preventDefault()
    setEnviando(true)
    setErrores({})
    setErrorGeneral('')

    // los datos del donante son opcionales: los vacíos no se envían
    const donante = sinVacios({
      donante_nombre: valores.donante_nombre,
      donante_correo: valores.donante_correo,
      donante_telefono: valores.donante_telefono,
    })

    let datos
    if (tipo === 'monetaria') {
      datos = {
        tipo_donacion: 'monetaria',
        monto_donacion: Number(valores.monto_donacion),
        metodo_pago: valores.metodo_pago,
        ...donante,
      }
    } else {
      const insumos = lista.comoDatos()
      datos = { tipo_donacion: 'insumos', descripcion_insumos: resumenDeInsumos(insumos), insumos, ...donante }
    }

    try {
      await crearDonacionPresencial(datos)
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
    <Modal title="Registrar donación presencial" onClose={onClose} className="donation-modal-confirmar">
      <form className="donation-form" onSubmit={enviar}>
        <p className="donation-form__nota">
          Queda registrada como confirmada y a tu nombre. Si son insumos, se agregan al
          inventario con la fecha de hoy.
        </p>

        <Campo etiqueta="Tipo de donación">
          <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="monetaria">Monetaria</option>
            <option value="insumos">Insumos</option>
          </select>
        </Campo>

        {tipo === 'monetaria' ? (
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

            <Campo etiqueta="Método de pago" error={errores.metodo_pago}>
              <select name="metodo_pago" value={valores.metodo_pago} onChange={cambiar}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </Campo>
          </>
        ) : (
          <DonationListaInsumos lista={lista} />
        )}

        <Campo etiqueta="Nombre del donante (opcional)" error={errores.donante_nombre}>
          <input
            name="donante_nombre"
            value={valores.donante_nombre}
            onChange={cambiar}
            maxLength={100}
            aria-invalid={Boolean(errores.donante_nombre)}
          />
        </Campo>

        <Campo etiqueta="Correo del donante (opcional)" error={errores.donante_correo}>
          <input
            name="donante_correo"
            type="email"
            value={valores.donante_correo}
            onChange={cambiar}
            maxLength={100}
            aria-invalid={Boolean(errores.donante_correo)}
          />
        </Campo>

        <Campo
          etiqueta="Teléfono del donante (opcional)"
          error={errores.donante_telefono}
          ayuda="Ejemplo: +56912345678"
        >
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
            {enviando ? 'Registrando...' : 'Registrar donación'}
          </button>
        </div>
      </form>
    </Modal>
  )
}