import { useEffect, useState } from 'react'
import {
  getAdopciones,
  getSolicitudesAdopcion,
  marcarAdoptado,
  rechazarSolicitud,
} from '../../services/api.js'
import { ESTADOS_SOLICITUD, TIPOS_VIVIENDA } from '../../data/estados.js'
import AdoptionForm from './AdoptionForm.jsx'
import VisitaForm from './VisitaForm.jsx'
import SolicitudExistenteForm from './SolicitudExistenteForm.jsx'
import './AdoptionSection.css'
import { usePermisos } from '../../sesion/sesion.js'

// Muestra una fecha de la base de datos como dd-mm-aaaa
function formatearFecha(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-CL', { timeZone: 'UTC' })
}

// Muestra fecha y hora (para la visita), ej: 20-11-2026, 15:30
function formatearFechaHora(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

// Pide las dos listas al mismo tiempo. Está fuera del componente porque no usa su estado
function pedirDatos() {
  return Promise.all([getSolicitudesAdopcion(), getAdopciones()])
}

export default function AdoptionSection() {
  // Mirar lo pueden todos; ingresar, agendar, rechazar y marcar como adoptado solo el Admin
  const { puedeAgregar, puedeGestionarAdopciones } = usePermisos()
  // Qué tabla se ve: 'solicitudes' o 'historial'
  const [vista, setVista] = useState('solicitudes')
  const [solicitudes, setSolicitudes] = useState([])
  const [adopciones, setAdopciones] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  // id_solicitud seleccionada (null = ninguna)
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  // Qué popup está abierto: null, 'ingresar' o 'visita'
  const [popup, setPopup] = useState(null)
  const [trabajando, setTrabajando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  // Cargar las dos listas al entrar a la pestaña
  useEffect(() => {
    pedirDatos()
      .then(([listaSolicitudes, listaAdopciones]) => {
        setSolicitudes(listaSolicitudes)
        setAdopciones(listaAdopciones)
        setEstado('listo')
      })
      .catch((error) => {
        setErrorCarga(error.message)
        setEstado('error')
      })
  }, [])

  const solicitudSeleccionada =
    solicitudes.find((solicitud) => solicitud.id_solicitud === seleccionadoId) ?? null

  // Vuelve a pedir las listas después de cualquier cambio
  // (el backend cambia varias cosas a la vez: la solicitud, el animal y otras solicitudes)
  async function recargar(textoExito) {
    try {
      const [listaSolicitudes, listaAdopciones] = await pedirDatos()
      setSolicitudes(listaSolicitudes)
      setAdopciones(listaAdopciones)
      setSeleccionadoId(null)
      setMensaje({ tipo: 'exito', texto: textoExito })
    } catch {
      setMensaje({ tipo: 'error', texto: 'El cambio se guardó, pero no se pudo actualizar la tabla. Recarga la página.' })
    }
  }

  function cambiarVista(nuevaVista) {
    setVista(nuevaVista)
    setMensaje(null)
    setSeleccionadoId(null)
  }

  // Si se aprieta la misma solicitud, se deselecciona; si es otra, se selecciona esa
  function alternarSeleccion(id) {
    setSeleccionadoId(seleccionadoId === id ? null : id)
  }

  function abrirPopup(nombre) {
    setMensaje(null)
    setPopup(nombre)
  }

  // Los popups llaman a estas funciones cuando el backend guardó
  
  // AdoptionForm avisa si se eligió un animal (true) o solo se registró la persona (false)
  function adoptanteIngresado(conAnimal) {
    setPopup(null)
    if (conAnimal) {
      recargar('Adoptante ingresado: el animal quedó en proceso de adopción')
    } else {
      recargar('Adoptante registrado: puedes asignarle un animal con "Ingresar Solicitud"')
    }
  }

  function solicitudIngresada() {
    setPopup(null)
    recargar('Solicitud ingresada: el animal quedó en proceso de adopción')
  }

  function visitaAgendada() {
    setPopup(null)
    recargar('Visita agendada: el animal quedó en proceso de adopción')
  }

  // Para "Rechazar" y "Marcar como adoptado": confirma, llama al backend y recarga
  async function ejecutar(accion, pregunta, textoExito) {
    if (!window.confirm(pregunta)) return
    setMensaje(null)
    setTrabajando(true)
    try {
      await accion(solicitudSeleccionada.id_solicitud)
      await recargar(textoExito)
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    } finally {
      setTrabajando(false)
    }
  }

  function rechazar() {
    const solicitud = solicitudSeleccionada
    ejecutar(
      rechazarSolicitud,
      `¿Rechazar la solicitud de ${solicitud.adoptante.nombre_adoptante} por ${solicitud.animal.nombre_animal}?`,
      'Solicitud rechazada',
    )
  }

  function adoptar() {
    const solicitud = solicitudSeleccionada
    ejecutar(
      marcarAdoptado,
      `¿Confirmar que ${solicitud.adoptante.nombre_adoptante} adoptó a ${solicitud.animal.nombre_animal}?`,
      `${solicitud.animal.nombre_animal} quedó registrado como adoptado`,
    )
  }

  // Qué botones se pueden usar según el estado de la solicitud seleccionada
  const estadoSeleccionada = solicitudSeleccionada?.estado
  const sePuedeAgendar = estadoSeleccionada === 'pendiente' || estadoSeleccionada === 'en_proceso'
  const sePuedeAdoptar = estadoSeleccionada === 'en_proceso'

  return (
    <>
      <div
        className="area-actions area-actions--adopcion"
        role="group"
        aria-label="Acciones de adopción"
      >
        <button
          className={`area-action${vista === 'solicitudes' ? ' is-active' : ''}`}
          type="button"
          aria-pressed={vista === 'solicitudes'}
          onClick={() => cambiarVista('solicitudes')}
        >
          Solicitudes
        </button>
        <button
          className={`area-action${vista === 'historial' ? ' is-active' : ''}`}
          type="button"
          aria-pressed={vista === 'historial'}
          onClick={() => cambiarVista('historial')}
        >
          Adopciones Registradas
        </button>

        {/* Ingresar adoptantes y solicitudes lo pueden hacer todos los roles */}
        {puedeAgregar && vista === 'solicitudes' && (
          <>
            <button className="area-action" type="button" onClick={() => abrirPopup('ingresar')}>
              Ingresar Adoptante
            </button>
            <button className="area-action" type="button" onClick={() => abrirPopup('solicitud')}>
              Ingresar Solicitud
            </button>
          </>
        )}

        {/* Agendar, rechazar y marcar como adoptado es solo del Admin */}
        {puedeGestionarAdopciones && vista === 'solicitudes' && (
          <>
            <button
              className="area-action"
              type="button"
              onClick={() => abrirPopup('visita')}
              disabled={!sePuedeAgendar || trabajando}
            >
              {estadoSeleccionada === 'en_proceso' ? 'Cambiar Visita' : 'Agendar Visita'}
            </button>
            <button
              className="area-action"
              type="button"
              onClick={rechazar}
              disabled={!solicitudSeleccionada || trabajando}
            >
              Rechazar
            </button>
            <button
              className="area-action"
              type="button"
              onClick={adoptar}
              disabled={!sePuedeAdoptar || trabajando}
            >
              Marcar como Adoptado
            </button>
            {!solicitudSeleccionada && (
              <p className="adoption-actions-help">
                Selecciona una solicitud para agendar la visita, rechazarla o marcar la adopción.
              </p>
            )}
          </>
        )}
      </div>

      <div className="adoption-table-container" aria-busy={estado === 'cargando'}>
        {mensaje && (
          <p className={`adoption-message adoption-message--${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </p>
        )}
        {estado === 'cargando' && <p role="status">Cargando adopciones...</p>}
        {estado === 'error' && (
          <p className="adoption-message adoption-message--error" role="alert">
            No se pudieron cargar los datos: {errorCarga}
          </p>
        )}

        {estado === 'listo' && vista === 'solicitudes' && (
          <div className="adoption-table-scroll">
            <table className="adoption-table">
              <caption>Solicitudes de adopción abiertas</caption>
              <thead>
                <tr>
                  <th scope="col">Seleccionar</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Animal</th>
                  <th scope="col">Especie</th>
                  <th scope="col">Adoptante</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Vivienda</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Visita</th>
                  <th scope="col">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 ? (
                  <tr>
                    <td className="adoption-table-empty" colSpan="11">
                      No hay solicitudes abiertas.
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((solicitud) => (
                    <tr
                      key={solicitud.id_solicitud}
                      className={solicitud.id_solicitud === seleccionadoId ? 'is-selected' : ''}
                      onClick={() => alternarSeleccion(solicitud.id_solicitud)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar solicitud de ${solicitud.adoptante.nombre_adoptante} por ${solicitud.animal.nombre_animal}`}
                          checked={solicitud.id_solicitud === seleccionadoId}
                          onChange={() => alternarSeleccion(solicitud.id_solicitud)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>
                      <td>{formatearFecha(solicitud.fecha_solicitud)}</td>
                      <td>{solicitud.animal.nombre_animal}</td>
                      <td>{solicitud.animal.especie_animal}</td>
                      <td>{solicitud.adoptante.nombre_adoptante ?? '—'}</td>
                      <td>{solicitud.adoptante.telefono}</td>
                      <td>{solicitud.adoptante.correo}</td>
                      <td>{TIPOS_VIVIENDA[solicitud.adoptante.tipo_vivienda] ?? '—'}</td>
                      <td>{ESTADOS_SOLICITUD[solicitud.estado] ?? solicitud.estado}</td>
                      <td>{formatearFechaHora(solicitud.fecha_visita)}</td>
                      <td>{solicitud.adoptante.observaciones_adoptante || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {estado === 'listo' && vista === 'historial' && (
          <div className="adoption-table-scroll">
            <table className="adoption-table">
              <caption>Adopciones registradas</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Animal</th>
                  <th scope="col">Especie</th>
                  <th scope="col">Adoptante</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Registrada por</th>
                </tr>
              </thead>
              <tbody>
                {adopciones.length === 0 ? (
                  <tr>
                    <td className="adoption-table-empty" colSpan="8">
                      Todavía no hay adopciones registradas.
                    </td>
                  </tr>
                ) : (
                  adopciones.map((adopcion) => (
                    <tr key={`${adopcion.id_animal}-${adopcion.id_adoptante}`}>
                      <td>{formatearFecha(adopcion.fecha_adopcion)}</td>
                      <td>{adopcion.animal?.nombre_animal ?? '—'}</td>
                      <td>{adopcion.animal?.especie_animal ?? '—'}</td>
                      <td>{adopcion.adoptante?.nombre_adoptante ?? '—'}</td>
                      <td>{adopcion.adoptante?.direccion ?? '—'}</td>
                      <td>{adopcion.adoptante?.telefono ?? '—'}</td>
                      <td>{adopcion.adoptante?.correo ?? '—'}</td>
                      <td>{adopcion.usuario?.nombre_usuario ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {popup === 'ingresar' && (
        <AdoptionForm onClose={() => setPopup(null)} onSaved={adoptanteIngresado} />
      )}
      {popup === 'solicitud' && (
        <SolicitudExistenteForm onClose={() => setPopup(null)} onSaved={solicitudIngresada} />
      )}
      {popup === 'visita' && solicitudSeleccionada && (
        <VisitaForm
          solicitud={solicitudSeleccionada}
          onClose={() => setPopup(null)}
          onSaved={visitaAgendada}
        />
      )}
    </>
  )
}