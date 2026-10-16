import { Router } from 'express';
import { obtenerAsistenciasController } from '../controllers/asistencia.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { mesQuerySchema } from '../schemas/asistencias.schema.js';

const router = Router();
//obtener la asistencia de un mes con los turnos de cada usuario, ej: /api/asistencias?mes=2026-10
//la asistencia se marca en cada turno con PATCH /api/turnos/:id/asistencia
router.get('/', validate(mesQuerySchema, 'query'), obtenerAsistenciasController);

export default router;
