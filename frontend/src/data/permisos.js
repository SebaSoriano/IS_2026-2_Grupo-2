// Qué puede hacer cada rol en la página. Son las mismas reglas que aplica el backend
// (requireEdicion y requireRol), escritas otra vez aquí solo para esconder botones.
// Si alguien se salta esto en su navegador igual no puede cambiar nada:
// el backend le responde 403.

// Nombres de los roles, iguales a los de la tabla Rol (los que vienen en usuario.rol)
export const ROLES = {
  ADMIN: 'Admin',
  VETERINARIA: 'Veterinaria',
  VOLUNTARIO: 'Voluntario',
}

// Admin y Veterinaria pueden agregar, modificar y eliminar registros.
// El Voluntario solo puede mirar.
export function puedeEditar(usuario) {
  return usuario?.rol === ROLES.ADMIN || usuario?.rol === ROLES.VETERINARIA
}

// Crear, modificar y eliminar usuarios (la sección Voluntarios) es solo del Admin
export function puedeGestionarUsuarios(usuario) {
  return usuario?.rol === ROLES.ADMIN
}