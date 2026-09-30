import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';
import adopcionesRoutes from './adopciones.routes.js';

const router = Router();

router.use('/insumos', insumosRouter);
router.use('/animales', animalesRoutes);
router.use('/adopciones', adopcionesRoutes);

export default router;