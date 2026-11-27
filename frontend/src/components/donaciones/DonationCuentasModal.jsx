import { useEffect, useState } from 'react'
import Modal from '../../schedule/Modal.jsx'
import { ROLES } from '../../data/permisos.js'
import { actualizarCuenta, crearCuenta, eliminarCuenta, getCuentas, getUsuarios } from '../../services/api.js'
import { Campo } from './DonationFormPartes.jsx'
import { erroresPorCampo, sinVacios } from './DonationFormValidacion.js'
import './DonationForm.css'

const Formulario = 'form'
const Entrada = 'input'
const Selector = 'select'
const Opcion = 'option'

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

// Pasa una cuenta de la API a los valores del formulario (los inputs no aceptan null)
const valoresDeCuenta = (cuenta) => ({
  banco: cuenta.banco,
  tipo_cuenta: cuenta.tipo_cuenta,
  numero_cuenta: cuenta.numero_cuenta,
  titular_nombre: cuenta.titular_nombre,
  titular_rut: cuenta.titular_rut,
  correo: cuenta.correo ?? '',
  rut_usuario: cuenta.rut_usuario,
})

// Pop-up de cuentas bancarias.
// La admin ve todas, y puede añadir, modificar y eliminar.
// Los demás roles ven solo la cuenta a su nombre y pueden modificarla (el backend ya filtra la lista).
export default function DonationCuentasModal({ usuario, onClose }) {
  const esAdmin = usuario.rol === ROLES.ADMIN
  const [cuentas, setCuentas] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  const [recarga, setRecarga] = useState(0)
  // 'lista', 'nueva', o { editar: cuenta }
  const [vista, setVista] = useState('lista')
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

  // después de añadir, modificar o eliminar: se vuelve a la lista, con un aviso, y se recarga
  const terminar = (mensaje) => {
    setAviso(mensaje)
    setVista('lista')
    setEstado('cargando')
    setRecarga((n) => n + 1)
  }

  const editando = vista?.editar
  const titulo = vista === 'nueva'
    ? 'Añadir cuenta bancaria'
    : editando ? 'Modificar cuenta bancaria' : 'Cuentas bancarias'

  return (
    <Modal title={titulo} onClose={onClose}>
      {vista === 'lista' ? (
        <ListaCuentas
          cuentas={cuentas}
          estado={estado}
          errorCarga={errorCarga}
          aviso={aviso}
          esAdmin={esAdmin}
          rutSesion={usuario.rut}
          onNueva={() => {
            setAviso('')
            setVista('nueva')
          }}
          onEditar={(cuenta) => {
            setAviso('')
            setVista({ editar: cuenta })
          }}
          onEliminada={terminar}
          onClose={onClose}
        />
      ) : (
        <FormularioCuenta
          // key: si se pasa de una cuenta a otra, el formulario parte de cero
          key={editando?.id_cuenta ?? 'nueva'}
          usuario={usuario}
          esAdmin={esAdmin}
          cuenta={editando}
          onCancelar={() => setVista('lista')}
          onListo={() =>
            terminar(
              editando
                ? 'Los cambios se guardaron y ya se ven en el formulario de donación.'
                : 'La cuenta se añadió y ya aparece en el formulario de donación.',
            )
          }
        />
      )}
    </Modal>
  )
}

function ListaCuentas({ cuentas, estado, errorCarga, aviso, esAdmin, rutSesion, onNueva, onEditar, onEliminada, onClose }) {
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

      {estado === 'listo' && cuentas.length === 0 && (
        <p className="donation-form__nota">
          {esAdmin
            ? 'No hay cuentas activas. Añade una para que se puedan recibir donaciones.'
            : 'Por ahora no hay cuentas activas.'}
        </p>
      )}

      {estado === 'listo' && cuentas.length > 0 && (
        <ul className="donation-cuentas-admin">
          {cuentas.map((cuenta) => (
            <li key={cuenta.id_cuenta}>
              <div className="donation-cuentas-admin__datos">
                <strong>{cuenta.banco} · {etiquetaTipo(cuenta.tipo_cuenta)}</strong>
                <span>N° {cuenta.numero_cuenta}</span>
                <span>{cuenta.titular_nombre} · {cuenta.titular_rut}</span>
                {cuenta.usuario && <span>Responsable: {cuenta.usuario.nombre_usuario}</span>}
              </div>
              <div className="donation-cuentas-admin__acciones">
                {(esAdmin || cuenta.rut_usuario === rutSesion) && (
                  <button type="button" className="modal__button" disabled={enviando} onClick={() => onEditar(cuenta)}>
                    Modificar
                  </button>
                )}
                {esAdmin && (
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
                )}
              </div>
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
        {esAdmin && (
          <button type="button" className="modal__button modal__button--primary" onClick={onNueva}>
            Añadir cuenta
          </button>
        )}
      </div>
    </div>
  )
}

// Sirve para añadir (sin "cuenta") y para modificar (con "cuenta")
function FormularioCuenta({ usuario, esAdmin, cuenta, onCancelar, onListo }) {
  const iniciales = cuenta ? valoresDeCuenta(cuenta) : { ...CUENTA_VACIA, rut_usuario: usuario.rut }
  const [valores, setValores] = useState(iniciales)
  const [usuarios, setUsuarios] = useState([])
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    // elegir responsable es solo de la admin; si falla, el selector queda solo con la persona de la sesión
    if (!esAdmin) return
    getUsuarios().then(setUsuarios).catch(() => setUsuarios([]))
  }, [esAdmin])

  const cambiar = (event) => {
    const { name, value } = event.target
    setValores((actuales) => ({ ...actuales, [name]: value }))
  }

  // Al modificar se mandan solo los campos que cambiaron.
  // El voluntario nunca manda rut_usuario (el backend se lo rechazaría).
  const cambiosParaEnviar = () => {
    const cambios = Object.fromEntries(
      Object.entries(valores).filter(([campo, valor]) => valor !== iniciales[campo]),
    )
    if (!esAdmin) delete cambios.rut_usuario
    // correo borrado: se manda null para que quede vacío en la base de datos
    if (cambios.correo === '') cambios.correo = null
    return cambios
  }

  const enviar = async (event) => {
    event.preventDefault()
    setErrores({})
    setErrorGeneral('')

    let datos
    if (cuenta) {
      datos = cambiosParaEnviar()
      if (Object.keys(datos).length === 0) {
        setErrorGeneral('No cambiaste ningún dato.')
        return
      }
    }

    setEnviando(true)
    try {
      if (cuenta) {
        await actualizarCuenta(cuenta.id_cuenta, datos)
      } else {
        // el correo es opcional: si va vacío no se envía (el backend rechazaría "")
        await crearCuenta(sinVacios(valores))
      }
      onListo()
    } catch (error) {
      const porCampo = erroresPorCampo(error)
      setErrores(porCampo)
      if (Object.keys(porCampo).length === 0) setErrorGeneral(error.message)
      setEnviando(false)
    }
  }

  const opcionesResponsable = usuarios.length > 0
    ? usuarios.map((u) => ({ rut: u.rut_usuario, nombre: u.nombre_usuario }))
    : [{ rut: valores.rut_usuario, nombre: cuenta?.usuario?.nombre_usuario ?? usuario.nombre }]

  return (
    <Formulario className="donation-form" onSubmit={enviar}>
      {cuenta && (
        <p className="donation-form__nota">
          Si la cuenta ya recibió donaciones, se guarda como una cuenta nueva y la anterior se conserva en el
          historial de esas donaciones.
        </p>
      )}

      <Campo etiqueta="Banco" error={errores.banco}>
        <Entrada name="banco" value={valores.banco} onChange={cambiar} maxLength={100} required
          aria-invalid={Boolean(errores.banco)} />
      </Campo>

      <Campo etiqueta="Tipo de cuenta" error={errores.tipo_cuenta}>
        <Selector name="tipo_cuenta" value={valores.tipo_cuenta} onChange={cambiar} required>
          {TIPOS_CUENTA.map(({ valor, etiqueta }) => (
            <Opcion key={valor} value={valor}>{etiqueta}</Opcion>
          ))}
        </Selector>
      </Campo>

      <Campo etiqueta="Número de cuenta" error={errores.numero_cuenta} ayuda="Solo números, entre 4 y 20 dígitos">
        <Entrada name="numero_cuenta" value={valores.numero_cuenta} onChange={cambiar} inputMode="numeric"
          pattern="\d{4,20}" maxLength={20} required aria-invalid={Boolean(errores.numero_cuenta)} />
      </Campo>

      <Campo etiqueta="Nombre del titular" error={errores.titular_nombre}>
        <Entrada name="titular_nombre" value={valores.titular_nombre} onChange={cambiar} maxLength={100} required
          aria-invalid={Boolean(errores.titular_nombre)} />
      </Campo>

      <Campo etiqueta="RUT del titular" error={errores.titular_rut} ayuda="Sin puntos y con guion, ej: 12345678-9">
        <Entrada name="titular_rut" value={valores.titular_rut} onChange={cambiar} maxLength={10} required
          aria-invalid={Boolean(errores.titular_rut)} />
      </Campo>

      <Campo etiqueta="Correo para avisar la transferencia (opcional)" error={errores.correo}>
        <Entrada name="correo" type="email" value={valores.correo} onChange={cambiar} maxLength={100}
          aria-invalid={Boolean(errores.correo)} />
      </Campo>

      {esAdmin && (
        <Campo
          etiqueta="Responsable"
          error={errores.rut_usuario}
          ayuda="Persona que revisa y confirma las donaciones que lleguen a esta cuenta"
        >
          <Selector name="rut_usuario" value={valores.rut_usuario} onChange={cambiar} required>
            {opcionesResponsable.map(({ rut, nombre }) => (
              <Opcion key={rut} value={rut}>{nombre}</Opcion>
            ))}
          </Selector>
        </Campo>
      )}

      {errorGeneral && <p className="donation-form__error" role="alert">{errorGeneral}</p>}

      <div className="modal__actions">
        <button type="button" className="modal__button" onClick={onCancelar} disabled={enviando}>
          Volver
        </button>
        <button type="submit" className="modal__button modal__button--primary" disabled={enviando}>
          {enviando ? 'Guardando...' : cuenta ? 'Guardar cambios' : 'Guardar cuenta'}
        </button>
      </div>
    </Formulario>
  )
}