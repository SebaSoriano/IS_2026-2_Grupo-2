import { Router } from 'express';
import insumosRouter from './insumos.routes.js';

const router = Router();

// Para comprobar rápido que el servidor responde
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.use('/insumos', insumosRouter);

export default router;