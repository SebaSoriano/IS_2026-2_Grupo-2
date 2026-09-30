import { Router } from 'express';
import { crearTurnoController } from '../controllers/turno.controller.js';

const router = Router();
router.post('/', crearTurnoController);

export default router;