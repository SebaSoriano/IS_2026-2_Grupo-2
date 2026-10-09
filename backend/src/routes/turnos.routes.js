import { Router } from 'express';
import { crearTurnoController } from '../controllers/turno.controller.js';
import { obtenerTurnosController } from '../controllers/turno.controller.js';
import { obtenerTurnosPorRutController } from '../controllers/turno.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { createTurnoSchema } from '../schemas/turnos.schema.js';
import { rutParamSchema } from '../schemas/usuario.schema.js';

const router = Router();
router.post('/', validate(createTurnoSchema, 'body'), crearTurnoController);
router.get('/', obtenerTurnosController);
//obtener los turnos de un usuario validando el formato del rut
router.get('/:rut', validate(rutParamSchema, 'params'), obtenerTurnosPorRutController);

export default router;
