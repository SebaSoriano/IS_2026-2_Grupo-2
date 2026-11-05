import { createContext, useContext } from 'react'
import { puedeEditar, puedeGestionarUsuarios } from '../data/permisos.js'

// Un "contexto" de React guarda un valor que cualquier componente de más abajo puede leer,
// sin tener que pasarlo como prop de padre a hijo a nieto (InternalPage → HistorialSection → ...).
// Aquí se guarda el usuario que inició sesión. Lo llena RutaProtegida.
export const SesionContext = createContext(null)

// Devuelve el usuario de la sesión: { rut, nombre, correo, rol }
export function useSesion() {
  return useContext(SesionContext)
}

// Devuelve qué puede hacer el usuario de la sesión, listo para usar en un componente:
// const { puedeEditar } = usePermisos()
// {puedeEditar && <button>Añadir</button>}
export function usePermisos() {
  const usuario = useSesion()
  return {
    puedeEditar: puedeEditar(usuario),
    puedeGestionarUsuarios: puedeGestionarUsuarios(usuario),
  }
}