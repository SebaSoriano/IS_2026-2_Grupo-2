import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';
import turnosRoutes from './turnos.routes.js';
import adopcionesRoutes from './adopciones.routes.js';
import auth from './authRoutes.js';

import authRoutes from './authRoutes.js';

const router = Router();

// Para comprobar rápido que el servidor responde
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.use('/insumos', insumosRouter);
router.use('/animales', animalesRoutes);
router.use('/turnos', turnosRoutes);
router.use('/adopciones', adopcionesRoutes);
router.use('/auth', authRoutes);

export default router;