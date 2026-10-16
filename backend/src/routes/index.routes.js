import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';
import turnosRoutes from './turnos.routes.js';
import horariosRoutes from './horarios.routes.js';
import asistenciasRoutes from './asistencias.routes.js';
import adopcionesRoutes from './adopciones.routes.js';
<<<<<<< HEAD
import historialRoutes from './historial.routes.js';
=======
import usuariosRoutes from './usuario.routes.js';
>>>>>>> dd009eab81dd4550cad2e304e6c18ea00a683be9
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
router.use('/historial', historialRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);

export default router;