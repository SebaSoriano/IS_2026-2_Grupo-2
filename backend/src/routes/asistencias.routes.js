import { Router } from 'express';
import { obtenerAsistenciasController } from '../controllers/asistencia.controller.js';
import { crearAsistenciaController } from '../controllers/asistencia.controller.js';
import { eliminarAsistenciaController } from '../controllers/asistencia.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { mesQuerySchema, createAsistenciaSchema } from '../schemas/asistencias.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();
//obtener la asistencia de un mes, ej: /api/asistencias?mes=2026-10
router.get('/', validate(mesQuerySchema, 'query'), obtenerAsistenciasController);
//marcar que un usuario llego a la hora un dia
router.post('/', validate(createAsistenciaSchema, 'body'), crearAsistenciaController);
//desmarcar una asistencia por su id
router.delete('/:id', validate(idParamSchema, 'params'), eliminarAsistenciaController);

export default router;
