import { Router } from 'express';
import insumosRouter from './insumos.routes.js';
import animalesRoutes from './animales.routes.js';
import turnosRoutes from './turnos.routes.js';
import horariosRoutes from './horarios.routes.js';
import asistenciasRoutes from './asistencias.routes.js';
import adopcionesRoutes from './adopciones.routes.js';
import historialRoutes from './historial.routes.js';
import usuariosRoutes from './usuario.routes.js';
import donacionesRoutes from './donaciones.routes.js';
import authRoutes from './authRoutes.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// ---------- Rutas públicas (no piden sesión) ----------

// Para comprobar rápido que el servidor responde
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// login, logout y me; cada ruta de auth decide adentro si pide sesión
router.use('/auth', authRoutes);

// donaciones tiene una ruta pública (POST /web, la usa la página pública),
// por eso la protección se pone dentro de donaciones.routes.js y no aquí
router.use('/donaciones', donacionesRoutes);

// ---------- Rutas de la intranet (piden sesión) ----------
// requireAuth se ejecuta antes que el router de cada sección:
// si no hay una cookie con un token válido, responde 401 y no llega al controlador

router.use('/insumos', requireAuth, insumosRouter);
router.use('/animales', requireAuth, animalesRoutes);
router.use('/turnos', requireAuth, turnosRoutes);
router.use('/horarios', requireAuth, horariosRoutes);
router.use('/asistencias', requireAuth, asistenciasRoutes);
router.use('/adopciones', requireAuth, adopcionesRoutes);
router.use('/historial', requireAuth, historialRoutes);
router.use('/usuarios', requireAuth, usuariosRoutes);

export default router;