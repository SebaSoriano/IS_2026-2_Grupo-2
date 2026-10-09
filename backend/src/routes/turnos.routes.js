import { Router } from 'express';
import { crearTurnoController } from '../controllers/turno.controller.js';
import { obtenerTurnosController } from '../controllers/turno.controller.js';
import { obtenerTurnosPorRutController } from '../controllers/turno.controller.js';
import { actualizarTurnoController } from '../controllers/turno.controller.js';
import { eliminarTurnoController } from '../controllers/turno.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { createTurnoSchema, updateTurnoSchema } from '../schemas/turnos.schema.js';
import { rutParamSchema } from '../schemas/usuario.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();
router.post('/', validate(createTurnoSchema, 'body'), crearTurnoController);
router.get('/', obtenerTurnosController);
//obtener los turnos de un usuario validando el formato del rut
router.get('/:rut', validate(rutParamSchema, 'params'), obtenerTurnosPorRutController);
//editar y borrar un turno por su id
router.put('/:id', validate(idParamSchema, 'params'), validate(updateTurnoSchema, 'body'), actualizarTurnoController);
router.delete('/:id', validate(idParamSchema, 'params'), eliminarTurnoController);

export default router;
