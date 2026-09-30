import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';

const router = Router();

// Para comprobar rápido que el servidor responde
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.use('/insumos', insumosRouter);
router.use('/animales', animalesRoutes);

export default router;