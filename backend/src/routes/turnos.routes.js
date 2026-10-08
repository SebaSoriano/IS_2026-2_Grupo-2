import { Router } from 'express';
import { crearTurnoController } from '../controllers/turno.controller.js';
import { obtenerTurnosController } from '../controllers/turno.controller.js';
const router = Router();
router.post('/', crearTurnoController);
router.get('/', obtenerTurnosController);

export default router;