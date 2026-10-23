import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';
import turnosRoutes from './turnos.routes.js';
import horariosRoutes from './horarios.routes.js';
import asistenciasRoutes from './asistencias.routes.js';
import adopcionesRoutes from './adopciones.routes.js';
import auth from './authRoutes.js';
import donacionesRoutes from './donaciones.routes.js';

import authRoutes from './authRoutes.js';

const router = Router();

// Para comprobar rápido que el servidor responde
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.use('/insumos', insumosRouter);
router.use('/animales', animalesRoutes);
router.use('/turnos', turnosRoutes);
router.use('/horarios', horariosRoutes);
router.use('/asistencias', asistenciasRoutes);
router.use('/adopciones', adopcionesRoutes);
router.use('/auth', authRoutes);
router.use('/donaciones', donacionesRoutes);

export default router;