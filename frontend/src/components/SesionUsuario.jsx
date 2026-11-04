import { useState } from 'react'
import { logout } from '../services/auth.js'
import './SesionUsuario.css'

// Muestra en el encabezado de la intranet quién inició sesión y el botón para cerrarla
export default function SesionUsuario({ usuario }) {
  // true mientras se espera la respuesta del logout (bloquea el botón)
  const [cerrando, setCerrando] = useState(false)

  const cerrarSesion = async () => {
    setCerrando(true)
    try {
      // el backend borra la cookie; después de esto el token ya no se manda
      await logout()
    } finally {
      // aunque falle la conexión se vuelve al login: sin cookie no se puede seguir en la intranet
      window.location.replace('/login')
    }
  }

  return (
    <div className="sesion-usuario">
      <span className="sesion-usuario__nombre">
        {usuario.nombre}
        <span className="sesion-usuario__rol">{usuario.rol}</span>
      </span>
      <button
        className="sesion-usuario__salir"
        type="button"
        onClick={cerrarSesion}
        disabled={cerrando}
      >
        {cerrando ? 'Cerrando...' : 'Cerrar sesión'}
      </button>
    </div>
  )
}