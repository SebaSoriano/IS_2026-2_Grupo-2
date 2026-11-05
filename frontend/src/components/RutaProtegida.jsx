import { useEffect, useState } from 'react'
import { obtenerSesion } from '../services/auth.js'
import { SesionContext } from '../sesion/sesion.js'

// Envuelve las páginas que necesitan sesión (la intranet).
// Al montarse le pregunta al backend si hay una sesión activa (GET /api/auth/me):
// - mientras espera la respuesta, muestra "Cargando..."
// - si no hay sesión, manda a la persona al login
// - si hay sesión, muestra la página y le pasa el usuario
// Ojo: esto solo mejora la experiencia (no se ve la intranet vacía).
// La seguridad de verdad está en el backend, que rechaza con 401 cualquier petición sin token.
export default function RutaProtegida({ children }) {
  // undefined = todavía no se sabe, null = no hay sesión, objeto = usuario con sesión
  const [usuario, setUsuario] = useState(undefined)

  useEffect(() => {
    // "activo" evita actualizar el estado si el componente se desmontó antes de la respuesta
    let activo = true

    obtenerSesion()
      .then((usuarioSesion) => {
        if (activo) setUsuario(usuarioSesion)
      })
      // si el servidor no responde se trata igual que no tener sesión
      .catch(() => {
        if (activo) setUsuario(null)
      })

    return () => {
      activo = false
    }
  }, [])

  // sin sesión: se reemplaza la URL por /login (replace, para que "atrás" no vuelva a la intranet)
  useEffect(() => {
    if (usuario === null) {
      window.location.replace('/login')
    }
  }, [usuario])

  if (!usuario) {
    return <p className="ruta-protegida-cargando">Cargando...</p>
  }

  // children es una función que recibe el usuario, ej: {(usuario) => <InternalPage usuario={usuario} />}
  // Además se guarda el usuario en SesionContext, para que cualquier sección
  // pueda saber su rol con usePermisos() sin recibirlo por props
  return (
    <SesionContext.Provider value={usuario}>
      {children(usuario)}
    </SesionContext.Provider>
  )
}