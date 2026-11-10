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
import { requireAuth, requireEdicion } from '../middlewares/auth.middleware.js';

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
// Cada sección pasa por dos middlewares, en este orden:
// 1. requireAuth: si no hay una cookie con un token válido responde 401 (no autenticado)
// 2. requireEdicion: deja leer (GET) y agregar (POST) a todos los roles,
//    pero modificar y eliminar (PUT, PATCH y DELETE) solo a Admin y Veterinaria;
//    si el Voluntario intenta modificar o eliminar, le responde 403 (prohibido)
// Express acepta un arreglo de middlewares, así no se repiten los dos en cada línea.
const conSesion = [requireAuth, requireEdicion];

router.use('/insumos', conSesion, insumosRouter);
router.use('/animales', conSesion, animalesRoutes);
router.use('/turnos', conSesion, turnosRoutes);
router.use('/horarios', conSesion, horariosRoutes);
router.use('/asistencias', conSesion, asistenciasRoutes);
router.use('/adopciones', conSesion, adopcionesRoutes);
router.use('/historial', conSesion, historialRoutes);
// en usuarios, además, modificar y eliminar es solo del Admin (ver usuario.routes.js)
router.use('/usuarios', conSesion, usuariosRoutes);

export default router;