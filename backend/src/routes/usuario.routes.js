import { Router } from 'express';
import { getUsuarios, updateUsuario, deleteUsuario } from '../controllers/usuario.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireRol } from '../middlewares/auth.middleware.js';
import { rutParamSchema, updateUsuarioSchema } from '../schemas/usuario.schema.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// la lista de usuarios la puede ver cualquiera con sesión (el horario la usa para mostrar nombres)
router.get('/', getUsuarios);

// modificar y eliminar usuarios es solo del Admin, igual que crearlos (/auth/register).
// La razón: el PUT permite cambiar el rol_id, así que si una Veterinaria pudiera editar usuarios
// podría cambiarse a sí misma a Admin y saltarse todos los permisos.
// requireEdicion (en index.routes.js) ya dejó pasar a Admin y Veterinaria; aquí se deja solo al Admin.
router.put('/:rut', requireRol(ROLES.ADMIN), validate(rutParamSchema, 'params'), validate(updateUsuarioSchema, 'body'), updateUsuario);
router.delete('/:rut', requireRol(ROLES.ADMIN), validate(rutParamSchema, 'params'), deleteUsuario);

export default router;