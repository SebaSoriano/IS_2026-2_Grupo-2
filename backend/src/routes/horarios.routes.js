import { Router } from 'express';
import { obtenerHorariosController } from '../controllers/horario.controller.js';
import { listarUsuariosController } from '../controllers/horario.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { semanaQuerySchema } from '../schemas/turnos.schema.js';

const router = Router();
//obtener el horario de una semana con los turnos de cada dia, ej: /api/horarios?semana=2026-10-12
router.get('/', validate(semanaQuerySchema, 'query'), obtenerHorariosController);
//listar todos los usuarios para asignarles un turno
router.get('/usuarios', listarUsuariosController);

export default router;
