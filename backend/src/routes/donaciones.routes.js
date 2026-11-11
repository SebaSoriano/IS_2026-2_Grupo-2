import { Router } from 'express';
import * as c from '../controllers/donaciones.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createDonacionPresencialSchema,
  createDonacionWebSchema,
  filtrosDonacionSchema,
  updateDonacionSchema,
  agendarDonacionSchema,
  confirmarDonacionSchema,
} from '../schemas/donaciones.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';
import { requireAuth, requireRol } from '../middlewares/auth.middleware.js';
import { recibirComprobante } from '../middlewares/upload.middleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();
const id = validate(idParamSchema, 'params');

// pública: la usa el formulario de donaciones de la página pública, sin iniciar sesión.
// Va ANTES del router.use(requireAuth), por eso no pide sesión
router.post('/web', recibirComprobante, validate(createDonacionWebSchema), c.createDonacionWeb);

// desde aquí hacia abajo, todas las rutas de donaciones piden sesión.
// Registrar una donación presencial (POST) lo puede hacer cualquier rol, también el Voluntario;
// las que modifican o eliminan (PATCH, DELETE) piden además ser Admin o Veterinaria.
// Express revisa las rutas en orden: un router.use sin ruta se aplica
// a todas las que se registran después de él
router.use(requireAuth);

router.get('/', validate(filtrosDonacionSchema, 'query'), c.getDonaciones);
router.get('/:id', id, c.getDonacionById);
router.get('/:id/comprobante', id, c.getComprobante);

router.post('/', validate(createDonacionPresencialSchema), c.createDonacionPresencial);

router.patch('/:id/agendar', id, validate(agendarDonacionSchema), c.agendarDonacion);
router.patch('/:id/confirmar', id, validate(confirmarDonacionSchema), c.confirmarDonacion);
router.patch('/:id', requireRol(ROLES.ADMIN), id, validate(updateDonacionSchema), c.updateDonacion);

router.delete('/:id', requireRol(ROLES.ADMIN), id, c.deleteDonacion);

export default router;