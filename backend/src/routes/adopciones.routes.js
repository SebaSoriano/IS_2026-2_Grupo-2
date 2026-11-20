import { Router } from 'express';
import {
  getAnimalParaAdoptar,
  createSolicitudPublica,
  getAdopciones,
  getSolicitudes,
  createSolicitudManual,
getAdoptantes,
  createSolicitudExistente,
  agendarVisita,
  rechazarSolicitud,
  marcarAdoptado,
} from '../controllers/adopciones.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { idParamSchema } from '../schemas/idParam.schema.js';
import { solicitudAdopcionSchema, solicitudExistenteSchema, visitaSchema } from '../schemas/adopciones.schema.js';
import { requireAuth, requireRol } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();
const id = validate(idParamSchema, 'params');

// ---------- Públicas: las usa la página principal, sin iniciar sesión ----------
// Van ANTES del router.use(requireAuth), por eso no piden sesión
router.get('/animales/:id', id, getAnimalParaAdoptar);
router.post('/solicitudes', validate(solicitudAdopcionSchema, 'body'), createSolicitudPublica);

// ---------- Desde aquí hacia abajo, todas piden sesión ----------
// Un router.use sin ruta se aplica a todas las rutas que se registran después de él
router.use(requireAuth);

// Mirar lo pueden hacer todos los roles
router.get('/', getAdopciones);
router.get('/solicitudes', getSolicitudes);

// Decidir (ingresar a mano, agendar visita, rechazar y marcar como adoptado) es solo del Admin
const soloAdmin = requireRol(ROLES.ADMIN);
router.post('/solicitudes/manual', soloAdmin, validate(solicitudAdopcionSchema, 'body'), createSolicitudManual);
router.get('/adoptantes', soloAdmin, getAdoptantes);
router.post('/solicitudes/existente', soloAdmin, validate(solicitudExistenteSchema, 'body'), createSolicitudExistente);
router.patch('/solicitudes/:id/visita', soloAdmin, id, validate(visitaSchema, 'body'), agendarVisita);
router.patch('/solicitudes/:id/rechazar', soloAdmin, id, rechazarSolicitud);
router.patch('/solicitudes/:id/adoptar', soloAdmin, id, marcarAdoptado);

export default router;