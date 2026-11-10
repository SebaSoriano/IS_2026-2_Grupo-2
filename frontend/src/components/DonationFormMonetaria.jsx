import { useEffect, useState } from 'react'
import Modal from '../schedule/Modal.jsx'
import { crearDonacionWebConComprobante, getCuentasPublicas } from '../services/api.js'
import { Campo, CamposDonante, erroresPorCampo, sinVacios } from './DonationFormPartes.jsx'
import './DonationForm.css'

const INICIAL = {
  monto_donacion: '',
  donante_nombre: '',
  donante_correo: '',
  donante_telefono: '',
}

const NOMBRE_TIPO_CUENTA = { corriente: 'corriente', vista: 'vista', ahorro: 'de ahorro', rut: 'RUT' }
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png']
const TAMANO_MAXIMO = 5 * 1024 * 1024 // 5 MB, igual que el servidor

// Comodidad para el usuario: el servidor vuelve a validar todo igual
function errorDeArchivo(archivo) {
  if (!archivo) return ''
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return 'Debe ser una imagen JPG o PNG'
  if (archivo.size > TAMANO_MAXIMO) return 'El archivo no puede superar los 5 MB'
  return ''
}

export default function DonationMonetariaForm({ onVolver, onClose }) {
  const [cuentas, setCuentas] = useState([])
  const [estadoCuentas, setEstadoCuentas] = useState('cargando') // 'cargando' | 'listo' | 'error'
  const [idCuenta, setIdCuenta] = useState('')
  const [valores, setValores] = useState(INICIAL)
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)

  useEffect(() => {
    let esVigente = true

    getCuentasPublicas()
      .then((lista) => {
        if (!esVigente) return
        setCuentas(lista)
        // si hay una sola cuenta, queda elegida de antemano
        if (lista.length === 1) setIdCuenta(String(lista[0].id_cuenta))
        setEstadoCuentas('listo')
      })
      .catch(() => {
        if (esVigente) setEstadoCuentas('error')
      })

    return () => {
      esVigente = false
    }
  }, [])

  const cambiar = (event) => {
    const { name, value } = event.target
    setValores((actuales) => ({ ...actuales, [name]: value }))
  }

  const elegirArchivo = (event) => {
    const elegido = event.target.files[0] ?? null
    setArchivo(elegido)
    setErrores((actuales) => ({ ...actuales, comprobante: errorDeArchivo(elegido) }))
  }

  const enviar = async (event) => {
    event.preventDefault()
    setErrorGeneral('')

    const errorArchivo = !archivo ? 'Adjunta el comprobante de la transferencia' : errorDeArchivo(archivo)
    if (errorArchivo) {
      setErrores((actuales) => ({ ...actuales, comprobante: errorArchivo }))
      return
    }

    setEnviando(true)
    setErrores({})

    // FormData es lo que permite enviar texto y archivo en una sola petición
    const formData = new FormData()
    const campos = sinVacios({
      ...valores,
      tipo_donacion: 'monetaria',
      metodo_pago: 'transferencia',
      id_cuenta: idCuenta,
    })
    for (const [clave, valor] of Object.entries(campos)) formData.append(clave, valor)
    formData.append('comprobante', archivo)

    try {
      await crearDonacionWebConComprobante(formData)
      setEnviada(true)
    } catch (error) {
      const porCampo = erroresPorCampo(error)
      setErrores(porCampo)
      if (Object.keys(porCampo).length === 0) setErrorGeneral(error.message)
    } finally {
      setEnviando(false)
    }
  }

  if (enviada) {
    return (
      <Modal title="¡Gracias por ayudar!" onClose={onClose}>
        <p>
          Recibimos tu donación y tu comprobante. Un voluntario confirmará la recepción de
          tu transferencia.
        </p>
        <div className="modal__actions">
          <button type="button" className="modal__button modal__button--primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </Modal>
    )
  }

  // Sin cuentas no se puede donar: se avisa en vez de mostrar un formulario que no sirve
  if (estadoCuentas !== 'listo' || cuentas.length === 0) {
    return (
      <Modal title="Donar dinero" onClose={onClose}>
        <p role={estadoCuentas === 'cargando' ? 'status' : 'alert'}>
          {estadoCuentas === 'cargando' && 'Cargando datos de transferencia...'}
          {estadoCuentas === 'error' && 'No pudimos cargar los datos de transferencia. Inténtalo de nuevo más tarde.'}
          {estadoCuentas === 'listo' && 'Por ahora no hay cuentas disponibles para recibir donaciones. Inténtalo más tarde.'}
        </p>
        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onVolver}>Volver</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Donar dinero" onClose={onClose}>
      <form className="donation-form" onSubmit={enviar}>
        <p className="donation-form__nota">
          Primero realiza la transferencia a una de las cuentas y luego completa este
          formulario con el monto y el comprobante.
        </p>

        <fieldset className="donation-cuentas">
          <legend>Elige a qué cuenta transferirás</legend>
          {cuentas.map((cuenta) => (
            <label
              key={cuenta.id_cuenta}
              className={`donation-cuenta${idCuenta === String(cuenta.id_cuenta) ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="id_cuenta"
                value={cuenta.id_cuenta}
                checked={idCuenta === String(cuenta.id_cuenta)}
                onChange={(event) => setIdCuenta(event.target.value)}
                required
              />
              <span className="donation-cuenta__datos">
                <strong>{cuenta.titular_nombre}</strong>
                <span>RUT {cuenta.titular_rut}</span>
                <span>
                  {cuenta.banco} · Cuenta {NOMBRE_TIPO_CUENTA[cuenta.tipo_cuenta]} N° {cuenta.numero_cuenta}
                </span>
                {cuenta.correo && <span>{cuenta.correo}</span>}
              </span>
            </label>
          ))}
          {errores.id_cuenta && <span className="donation-field__error" role="alert">{errores.id_cuenta}</span>}
        </fieldset>

        <Campo etiqueta="Monto transferido (CLP)" error={errores.monto_donacion}>
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

        <Campo
          etiqueta="Comprobante de la transferencia"
          error={errores.comprobante}
          ayuda="Imagen JPG o PNG, máximo 5 MB."
        >
          <input
            name="comprobante"
            type="file"
            accept="image/png,image/jpeg"
            onChange={elegirArchivo}
            required
            aria-invalid={Boolean(errores.comprobante)}
          />
        </Campo>

        <CamposDonante valores={valores} errores={errores} onChange={cambiar} />

        {errorGeneral && <p className="donation-form__error" role="alert">{errorGeneral}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onVolver} disabled={enviando}>
            Volver
          </button>
          <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar donación'}
          </button>
        </div>
      </form>
    </Modal>
  )
}