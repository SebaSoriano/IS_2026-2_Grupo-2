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
import { requireAuth, requireEdicion } from '../middlewares/auth.middleware.js';

const router = Router();
const id = validate(idParamSchema, 'params');

// pública: la usa el formulario de donaciones de la página pública, sin iniciar sesión.
// Va ANTES del router.use(requireAuth), por eso no pide sesión
router.post('/web', validate(createDonacionWebSchema), c.createDonacionWeb);

// desde aquí hacia abajo, todas las rutas de donaciones piden sesión,
// y las que cambian datos (POST, PATCH, DELETE) piden además ser Admin o Veterinaria.
// Express revisa las rutas en orden: un router.use sin ruta se aplica
// a todas las que se registran después de él
router.use(requireAuth, requireEdicion);

router.get('/', validate(filtrosDonacionSchema, 'query'), c.getDonaciones);
router.get('/:id', id, c.getDonacionById);

router.post('/', validate(createDonacionPresencialSchema), c.createDonacionPresencial);

router.patch('/:id', id, validate(updateDonacionSchema), c.updateDonacion);
router.patch('/:id/agendar', id, validate(agendarDonacionSchema), c.agendarDonacion);
router.patch('/:id/confirmar', id, validate(confirmarDonacionSchema), c.confirmarDonacion);

router.delete('/:id', id, c.deleteDonacion);

export default router;