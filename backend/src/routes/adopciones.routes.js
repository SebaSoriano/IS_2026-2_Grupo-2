import { Router } from 'express';
import {
  getAnimalParaAdoptar,
  createSolicitudPublica,
  getAdopciones,
  getSolicitudes,
  createSolicitudManual,
  getAdoptantes,
  getCertificado,
  createSolicitudExistente,
  agendarVisita,
  rechazarSolicitud,
  marcarAdoptado,
} from '../controllers/adopciones.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { recibirCertificado } from '../middlewares/upload.middleware.js';
import { idParamSchema } from '../schemas/idParam.schema.js';
import { solicitudAdopcionSchema, ingresoManualSchema, solicitudExistenteSchema, visitaSchema } from '../schemas/adopciones.schema.js';
import { requireAuth, requireRol } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();
const id = validate(idParamSchema, 'params');

// ---------- Públicas: las usa la página principal, sin iniciar sesión ----------
// Van ANTES del router.use(requireAuth), por eso no piden sesión
router.get('/animales/:id', id, getAnimalParaAdoptar);
// recibirCertificado va ANTES de validate: multer es el que lee el formulario y llena req.body y req.file
router.post('/solicitudes', recibirCertificado, validate(solicitudAdopcionSchema, 'body'), createSolicitudPublica);

// ---------- Desde aquí hacia abajo, todas piden sesión ----------
// Un router.use sin ruta se aplica a todas las rutas que se registran después de él
router.use(requireAuth);

// Mirar lo pueden hacer todos los roles
router.get('/', getAdopciones);
router.get('/solicitudes', getSolicitudes);

// Iniciar un proceso de adopción (adoptante nuevo o ya registrado) lo pueden hacer todos los roles
router.post('/solicitudes/manual', validate(ingresoManualSchema, 'body'), createSolicitudManual);
router.get('/adoptantes', getAdoptantes);
router.post('/solicitudes/existente', validate(solicitudExistenteSchema, 'body'), createSolicitudExistente);

// Decidir (agendar visita, rechazar y marcar como adoptado) es solo del Admin
const soloAdmin = requireRol(ROLES.ADMIN);

router.patch('/solicitudes/:id/visita', soloAdmin, id, validate(visitaSchema, 'body'), agendarVisita);
router.patch('/solicitudes/:id/rechazar', soloAdmin, id, rechazarSolicitud);
router.patch('/solicitudes/:id/adoptar', soloAdmin, id, marcarAdoptado);
// El certificado de antecedentes es un dato personal: solo lo ve el Admin
router.get('/adoptantes/:id/certificado', soloAdmin, id, getCertificado);

export default router;