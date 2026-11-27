import { useEffect, useState } from 'react'
import Modal from '../../schedule/Modal.jsx'
import { crearCuenta, eliminarCuenta, getCuentas, getUsuarios } from '../../services/api.js'
import { Campo } from './DonationFormPartes.jsx'
import { erroresPorCampo, sinVacios } from './DonationFormValidacion.js'
import './DonationForm.css'

// los mismos valores que el enum TipoCuenta del backend
const TIPOS_CUENTA = [
  { valor: 'corriente', etiqueta: 'Cuenta corriente' },
  { valor: 'vista', etiqueta: 'Cuenta vista' },
  { valor: 'ahorro', etiqueta: 'Cuenta de ahorro' },
  { valor: 'rut', etiqueta: 'CuentaRUT' },
]
const etiquetaTipo = (valor) => TIPOS_CUENTA.find((t) => t.valor === valor)?.etiqueta ?? valor

const CUENTA_VACIA = {
  banco: '',
  tipo_cuenta: 'corriente',
  numero_cuenta: '',
  titular_nombre: '',
  titular_rut: '',
  correo: '',
  rut_usuario: '',
}

// Pop-up del Admin para ver, añadir y eliminar las cuentas que aparecen en el formulario de donación
export default function DonationCuentasModal({ usuario, onClose }) {
  const [cuentas, setCuentas] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  const [recarga, setRecarga] = useState(0)
  const [vista, setVista] = useState('lista') // 'lista' | 'nueva'
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    let esVigente = true
    getCuentas()
      .then((data) => {
        if (!esVigente) return
        // las desactivadas ya no se ven en la front page, así que tampoco se listan aquí
        setCuentas(data.filter((cuenta) => cuenta.activa))
        setEstado('listo')
      })
      .catch((error) => {
        if (!esVigente) return
        setErrorCarga(error.message)
        setEstado('error')
      })
    return () => {
      esVigente = false
    }
  }, [recarga])

  // después de añadir o eliminar: se vuelve a la lista, con un aviso, y se recarga
  const terminar = (mensaje) => {
    setAviso(mensaje)
    setVista('lista')
    setEstado('cargando')
    setRecarga((n) => n + 1)
  }

  return (
    <Modal title={vista === 'nueva' ? 'Añadir cuenta bancaria' : 'Cuentas bancarias'} onClose={onClose}>
      {vista === 'nueva' ? (
        <FormularioCuenta
          usuario={usuario}
          onCancelar={() => setVista('lista')}
          onListo={() => terminar('La cuenta se añadió y ya aparece en el formulario de donación.')}
        />
      ) : (
        <ListaCuentas
          cuentas={cuentas}
          estado={estado}
          errorCarga={errorCarga}
          aviso={aviso}
          onNueva={() => {
            setAviso('')
            setVista('nueva')
          }}
          onEliminada={terminar}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function ListaCuentas({ cuentas, estado, errorCarga, aviso, onNueva, onEliminada, onClose }) {
  const [porEliminar, setPorEliminar] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  // el backend exige que quede al menos una cuenta activa
  const esLaUltima = cuentas.length <= 1

  const eliminar = async () => {
    setEnviando(true)
    setError('')
    try {
      const { resultado } = await eliminarCuenta(porEliminar.id_cuenta)
      setPorEliminar(null)
      onEliminada(
        resultado === 'desactivada'
          ? 'La cuenta tenía donaciones registradas: se quitó del formulario de donación, pero se conserva para no perder ese historial.'
          : 'La cuenta se eliminó.',
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="donation-form">
      {aviso && <p className="donation-form__nota" role="status">{aviso}</p>}
      {estado === 'cargando' && <p role="status">Cargando cuentas...</p>}
      {estado === 'error' && (
        <p className="donation-form__error" role="alert">No se pudieron cargar las cuentas: {errorCarga}</p>
      )}

      {estado === 'listo' && (
        <ul className="donation-cuentas-admin">
          {cuentas.map((cuenta) => (
            <li key={cuenta.id_cuenta}>
              <div className="donation-cuentas-admin__datos">
                <strong>{cuenta.banco} · {etiquetaTipo(cuenta.tipo_cuenta)}</strong>
                <span>N° {cuenta.numero_cuenta}</span>
                <span>{cuenta.titular_nombre} · {cuenta.titular_rut}</span>
                {cuenta.usuario && <span>Responsable: {cuenta.usuario.nombre_usuario}</span>}
              </div>
              <button
                type="button"
                className="modal__button modal__button--danger"
                disabled={esLaUltima || enviando}
                title={esLaUltima ? 'Debe quedar al menos una cuenta para recibir donaciones' : undefined}
                onClick={() => {
                  setError('')
                  setPorEliminar(cuenta)
                }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {porEliminar && (
        <div className="donation-form__nota" role="alertdialog" aria-label="Confirmar eliminación">
          <p>
            ¿Eliminar la cuenta de {porEliminar.banco} N° {porEliminar.numero_cuenta}? Dejará de aparecer en
            el formulario de donación.
          </p>
          <div className="modal__actions">
            <button type="button" className="modal__button" onClick={() => setPorEliminar(null)} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="modal__button modal__button--danger" onClick={eliminar} disabled={enviando}>
              {enviando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="donation-form__error" role="alert">{error}</p>}

      <div className="modal__actions">
        <button type="button" className="modal__button" onClick={onClose}>
          Cerrar
        </button>
        <button type="button" className="modal__button modal__button--primary" onClick={onNueva}>
          Añadir cuenta
        </button>
      </div>
    </div>
  )
}