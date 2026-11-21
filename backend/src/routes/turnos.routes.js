import { Router } from 'express';
import { crearTurnoController } from '../controllers/turno.controller.js';
import { actualizarTurnoController } from '../controllers/turno.controller.js';
import { eliminarTurnoController } from '../controllers/turno.controller.js';
import { marcarAsistenciaTurnoController } from '../controllers/turno.controller.js';
import { obtenerTurnoParaLlegadaController, registrarLlegadaController } from '../controllers/turno.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { requireRol } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import { createTurnoSchema, updateTurnoSchema, asistenciaTurnoSchema } from '../schemas/turnos.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();
router.post('/', validate(createTurnoSchema, 'body'), crearTurnoController);
//boton "Llegué": ver si la persona de la sesion tiene un turno en curso y registrar su llegada
//POST lo pueden usar todos los roles (requireEdicion en index.routes.js)
router.get('/llegada', obtenerTurnoParaLlegadaController);
router.post('/llegada', registrarLlegadaController);
//editar y borrar un turno por su id
router.put('/:id', validate(idParamSchema, 'params'), validate(updateTurnoSchema, 'body'), actualizarTurnoController);
router.delete('/:id', validate(idParamSchema, 'params'), eliminarTurnoController);
//solo el Admin corrige a mano la asistencia de un turno (Veterinaria y Voluntario reciben 403)
router.patch('/:id/asistencia', requireRol(ROLES.ADMIN), validate(idParamSchema, 'params'), validate(asistenciaTurnoSchema, 'body'), marcarAsistenciaTurnoController);

export default router;
