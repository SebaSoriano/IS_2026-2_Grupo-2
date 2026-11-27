import { Router } from 'express';
import { crearTurnoController } from '../controllers/turno.controller.js';
import { actualizarTurnoController } from '../controllers/turno.controller.js';
import { eliminarTurnoController } from '../controllers/turno.controller.js';
import { marcarAsistenciaTurnoController } from '../controllers/turno.controller.js';
import { obtenerTurnoParaLlegadaController, registrarLlegadaController } from '../controllers/turno.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { requireRol } from '../middlewares/auth.middleware.js';
import { ROLES, ROLES_QUE_CREAN } from '../config/roles.js';
import { createTurnoSchema, updateTurnoSchema, asistenciaTurnoSchema } from '../schemas/turnos.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();

// turnos no pasa por requireEdicion (ver index.routes.js): los tres roles pueden añadir, editar y borrar.
// Que cada uno toque solo lo suyo lo revisa turno.service.js:
// - Admin: cualquier turno
// - Veterinaria y Voluntario: solo sus propios turnos (si no, 403)
// Se revisa que el rol sea uno de los conocidos para que un rol nuevo no reciba permisos sin querer.
const rolesConocidos = requireRol(...ROLES_QUE_CREAN);

router.post('/', rolesConocidos, validate(createTurnoSchema, 'body'), crearTurnoController);
//boton "Llegué": ver si la persona de la sesion tiene un turno en curso y registrar su llegada
//lo pueden usar todos los roles
router.get('/llegada', obtenerTurnoParaLlegadaController);
router.post('/llegada', rolesConocidos, registrarLlegadaController);
//editar y borrar un turno por su id (Veterinaria y Voluntario solo los propios, lo revisa el service)
router.put('/:id', rolesConocidos, validate(idParamSchema, 'params'), validate(updateTurnoSchema, 'body'), actualizarTurnoController);
router.delete('/:id', rolesConocidos, validate(idParamSchema, 'params'), eliminarTurnoController);
//solo el Admin corrige a mano la asistencia de un turno (Veterinaria y Voluntario reciben 403)
router.patch('/:id/asistencia', requireRol(ROLES.ADMIN), validate(idParamSchema, 'params'), validate(asistenciaTurnoSchema, 'body'), marcarAsistenciaTurnoController);

export default router;
