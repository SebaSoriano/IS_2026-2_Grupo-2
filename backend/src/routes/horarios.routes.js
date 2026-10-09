import { Router } from 'express';
import { obtenerHorariosController } from '../controllers/horario.controller.js';
import { buscarUsuariosController } from '../controllers/horario.controller.js';

import { validate } from '../middlewares/validate.middleware.js';
import { buscarUsuarioQuerySchema } from '../schemas/usuario.schema.js';

const router = Router();
//obtener el horario semanal con los turnos de cada dia
router.get('/', obtenerHorariosController);
//buscar usuarios por nombre para asignarles un turno, ej: /api/horarios/usuarios?nombre=luk
router.get('/usuarios', validate(buscarUsuarioQuerySchema, 'query'), buscarUsuariosController);

export default router;
