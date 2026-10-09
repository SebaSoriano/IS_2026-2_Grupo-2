import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';
import turnosRoutes from './turnos.routes.js';
import adopcionesRoutes from './adopciones.routes.js';
import donacionesRoutes from './donaciones.routes.js';
const router = Router();

router.use('/insumos', insumosRouter);
router.use('/animales', animalesRoutes);
router.use('/turnos', turnosRoutes);
router.use('/adopciones', adopcionesRoutes);
router.use('/donaciones', donacionesRoutes);

export default router;