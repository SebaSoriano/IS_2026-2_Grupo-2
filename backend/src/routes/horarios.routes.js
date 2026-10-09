import { Router } from 'express';
import { obtenerHorariosController } from '../controllers/horario.controller.js';

const router = Router();
//obtener el horario semanal con los turnos de cada dia
router.get('/', obtenerHorariosController);

export default router;
