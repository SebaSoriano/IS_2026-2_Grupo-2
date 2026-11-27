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

// Añadir turnos a nombre de otra persona es solo del Admin;
// Veterinaria y Voluntario solo pueden añadir turnos a su propio nombre
export function puedeAsignarTurnos(usuario) {
  return usuario?.rol === ROLES.ADMIN
}

// Decidir sobre las adopciones (agendar visitas, rechazar y marcar como adoptado) es solo del Admin.
// Ingresar adoptantes y solicitudes lo pueden hacer todos los roles (puedeAgregar)
export function puedeGestionarAdopciones(usuario) {
  return usuario?.rol === ROLES.ADMIN
}

// Editar y borrar turnos: el Admin puede con cualquier turno;
// Veterinaria y Voluntario solo con sus propios turnos (los que tienen su rut), no los de otras personas
export function puedeModificarTurno(usuario, turno) {
  if (usuario?.rol === ROLES.ADMIN) return true
  return puedeAgregar(usuario) && turno?.rut_usuario === usuario.rut
}

// Corregir la asistencia a mano (en la tabla de Asistencia) es solo del Admin;
// Veterinaria y Voluntario ven la tabla, pero no pueden corregirla
export function puedeCorregirAsistencia(usuario) {
  return usuario?.rol === ROLES.ADMIN
}

// Crear, modificar y eliminar usuarios (la sección Voluntarios) es solo del Admin
export function puedeGestionarUsuarios(usuario) {
  return usuario?.rol === ROLES.ADMIN
}
