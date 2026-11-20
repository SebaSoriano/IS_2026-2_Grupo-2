import { Router } from 'express';
import { crearTurnoController } from '../controllers/turno.controller.js';
import { obtenerTurnosController } from '../controllers/turno.controller.js';
import { obtenerTurnosPorRutController } from '../controllers/turno.controller.js';
import { actualizarTurnoController } from '../controllers/turno.controller.js';
import { eliminarTurnoController } from '../controllers/turno.controller.js';
import { marcarAsistenciaTurnoController } from '../controllers/turno.controller.js';
import { obtenerTurnoParaLlegadaController, registrarLlegadaController } from '../controllers/turno.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { createTurnoSchema, updateTurnoSchema, asistenciaTurnoSchema } from '../schemas/turnos.schema.js';
import { rutParamSchema } from '../schemas/usuario.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();
router.post('/', validate(createTurnoSchema, 'body'), crearTurnoController);
router.get('/', obtenerTurnosController);
//boton "Llegué": ver si la persona de la sesion tiene un turno en curso y registrar su llegada
//van antes de '/:rut' para que "llegada" no se lea como un rut
//POST lo pueden usar todos los roles (requireEdicion en index.routes.js)
router.get('/llegada', obtenerTurnoParaLlegadaController);
router.post('/llegada', registrarLlegadaController);
//obtener los turnos de un usuario validando el formato del rut
router.get('/:rut', validate(rutParamSchema, 'params'), obtenerTurnosPorRutController);
//editar y borrar un turno por su id
router.put('/:id', validate(idParamSchema, 'params'), validate(updateTurnoSchema, 'body'), actualizarTurnoController);
router.delete('/:id', validate(idParamSchema, 'params'), eliminarTurnoController);
//Admin o Veterinaria corrigen a mano la asistencia de un turno (PATCH: requireEdicion deja solo a esos roles)
router.patch('/:id/asistencia', validate(idParamSchema, 'params'), validate(asistenciaTurnoSchema, 'body'), marcarAsistenciaTurnoController);

export default router;
