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

// Los tres roles pueden agregar registros nuevos (los botones "Añadir ...", "Registrar ...").
// Se revisa que el rol sea uno de los conocidos, y no solo que haya sesión,
// para que un rol nuevo que se cree en la base de datos no reciba permisos sin querer.
export function puedeAgregar(usuario) {
  return [ROLES.ADMIN, ROLES.VETERINARIA, ROLES.VOLUNTARIO].includes(usuario?.rol)
}

// Solo Admin y Veterinaria pueden modificar y eliminar registros que ya existen.
// El Voluntario puede agregar, pero no cambiar ni borrar.
export function puedeEditar(usuario) {
  return usuario?.rol === ROLES.ADMIN || usuario?.rol === ROLES.VETERINARIA
}

// Crear, modificar y eliminar usuarios (la sección Voluntarios) es solo del Admin
export function puedeGestionarUsuarios(usuario) {
  return usuario?.rol === ROLES.ADMIN
}