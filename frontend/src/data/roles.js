// Roles del sistema (los mismos que crea el seed del backend)
export const roles = [
  { id: 1, nombre: 'Admin' },
  { id: 2, nombre: 'Veterinaria' },
  { id: 3, nombre: 'Voluntario' },
]

// Devuelve el nombre de un rol a partir de su id. Ej: nombreDelRol(3) → 'Voluntario'
export function nombreDelRol(id) {
  const rol = roles.find((r) => r.id === id)
  return rol ? rol.nombre : '—'
}