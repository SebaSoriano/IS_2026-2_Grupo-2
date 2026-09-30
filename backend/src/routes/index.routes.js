import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';

const router = Router();

router.use('/insumos', insumosRouter);
router.use('/animales', animalesRoutes);

export default router;