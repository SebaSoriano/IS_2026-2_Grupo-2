import { useEffect, useState } from 'react'
import { eliminarUsuario, getUsuarios } from '../services/api.js'
import { nombreDelRol } from '../data/roles.js'
import VolunteerForm from './VolunteerForm.jsx'
import './VolunteerSection.css'

// Muestra una fecha de la base de datos como dd-mm-aaaa
function formatearFecha(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-CL', { timeZone: 'UTC' })
}

export default function VolunteerSection() {
  const [usuarios, setUsuarios] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  // RUT del voluntario seleccionado en la tabla (null = ninguno)
  const [seleccionadoRut, setSeleccionadoRut] = useState(null)
  // Qué popup está abierto: null, 'crear' o 'modificar'
  const [formularioAbierto, setFormularioAbierto] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  // Cargar los voluntarios al entrar a la pestaña
  useEffect(() => {
    getUsuarios()
      .then((lista) => {
        setUsuarios(lista)
        setEstado('listo')
      })
      .catch((error) => {
        setErrorCarga(error.message)
        setEstado('error')
      })
  }, [])

  const usuarioSeleccionado =
    usuarios.find((usuario) => usuario.rut_usuario === seleccionadoRut) ?? null

  function abrirCrear() {
    setMensaje(null)
    setFormularioAbierto('crear')
  }

  function abrirModificar() {
    setMensaje(null)
    setFormularioAbierto('modificar')
  }

  function cerrarFormulario() {
    setFormularioAbierto(null)
  }

  // VolunteerForm llama a esta función cuando el backend guardó al voluntario
  function usuarioGuardado(usuario) {
    if (formularioAbierto === 'crear') {
      setUsuarios([usuario, ...usuarios])
      setMensaje({ tipo: 'exito', texto: `Voluntario ${usuario.nombre_usuario} registrado` })
    } else {
      setUsuarios(
        usuarios.map((actual) =>
          actual.rut_usuario === usuario.rut_usuario ? { ...actual, ...usuario } : actual,
        ),
      )
      setMensaje({ tipo: 'exito', texto: `Voluntario ${usuario.nombre_usuario} modificado` })
    }
    setFormularioAbierto(null)
  }

  async function eliminarSeleccionado() {
    if (!usuarioSeleccionado) return

    const confirmado = window.confirm(
      `¿Eliminar a ${usuarioSeleccionado.nombre_usuario} (${usuarioSeleccionado.rut_usuario})?`,
    )
    if (!confirmado) return

    setMensaje(null)
    try {
      await eliminarUsuario(usuarioSeleccionado.rut_usuario)
      setUsuarios(
        usuarios.filter((usuario) => usuario.rut_usuario !== usuarioSeleccionado.rut_usuario),
      )
      setSeleccionadoRut(null)
      setMensaje({ tipo: 'exito', texto: 'Voluntario eliminado' })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    }
  }

  return (
    <>
      <div
        className="area-actions area-actions--voluntarios"
        role="group"
        aria-label="Acciones de voluntarios"
      >
        <button className="area-action" type="button" onClick={abrirCrear}>
          Añadir Voluntario
        </button>
        <button
          className="area-action"
          type="button"
          onClick={abrirModificar}
          disabled={!usuarioSeleccionado}
        >
          Modificar Voluntario
        </button>
        <button
          className="area-action"
          type="button"
          onClick={eliminarSeleccionado}
          disabled={!usuarioSeleccionado}
        >
          Eliminar Voluntario
        </button>
        {!usuarioSeleccionado && (
          <p className="volunteer-actions-help">
            Selecciona un voluntario en la tabla para modificarlo o eliminarlo.
          </p>
        )}
      </div>

      <div className="volunteer-table-container" aria-busy={estado === 'cargando'}>
        {mensaje && (
          <p className={`volunteer-message volunteer-message--${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </p>
        )}
        {estado === 'cargando' && <p role="status">Cargando voluntarios...</p>}
        {estado === 'error' && (
          <p className="volunteer-message volunteer-message--error" role="alert">
            No se pudieron cargar los voluntarios: {errorCarga}
          </p>
        )}
        {estado === 'listo' && (
          <div className="volunteer-table-scroll">
            <table className="volunteer-table">
              <caption>Voluntarios registrados</caption>
              <thead>
                <tr>
                  <th scope="col">Seleccionar</th>
                  <th scope="col">RUT</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Fecha de nacimiento</th>
                  <th scope="col">Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td className="volunteer-table-empty" colSpan="7">
                      No hay voluntarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr
                      key={usuario.rut_usuario}
                      className={usuario.rut_usuario === seleccionadoRut ? 'is-selected' : ''}
                      onClick={() => setSeleccionadoRut(usuario.rut_usuario)}
                    >
                      <td>
                        <input
                          type="radio"
                          name="voluntario-seleccionado"
                          aria-label={`Seleccionar a ${usuario.nombre_usuario}`}
                          checked={usuario.rut_usuario === seleccionadoRut}
                          onChange={() => setSeleccionadoRut(usuario.rut_usuario)}
                        />
                      </td>
                      <td>{usuario.rut_usuario}</td>
                      <td>{usuario.nombre_usuario}</td>
                      <td>{usuario.correo || '—'}</td>
                      <td>{usuario.telefono || '—'}</td>
                      <td>{formatearFecha(usuario.fecha_nacimiento)}</td>
                      <td>{nombreDelRol(usuario.rol_id)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formularioAbierto && (
        <VolunteerForm
          usuario={formularioAbierto === 'modificar' ? usuarioSeleccionado : null}
          onClose={cerrarFormulario}
          onSaved={usuarioGuardado}
        />
      )}
    </>
  )
}