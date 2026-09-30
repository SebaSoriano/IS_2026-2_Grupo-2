import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import turnosRoutes from './turnos.routes.js';

const router = Router();

router.use('/insumos', insumosRouter);
router.use('/turnos', turnosRoutes);

export default router;