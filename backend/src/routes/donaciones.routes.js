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
import { recibirComprobante } from '../middlewares/upload.middleware.js';

const router = Router();
const id = validate(idParamSchema, 'params');

router.get('/', validate(filtrosDonacionSchema, 'query'), c.getDonaciones);
router.get('/:id', id, c.getDonacionById);
router.get('/:id/comprobante', id, c.getComprobante);

router.post('/', validate(createDonacionPresencialSchema), c.createDonacionPresencial);
router.post('/web', recibirComprobante, validate(createDonacionWebSchema), c.createDonacionWeb);

router.patch('/:id', id, validate(updateDonacionSchema), c.updateDonacion);
router.patch('/:id/agendar', id, validate(agendarDonacionSchema), c.agendarDonacion);
router.patch('/:id/confirmar', id, validate(confirmarDonacionSchema), c.confirmarDonacion);

router.delete('/:id', id, c.deleteDonacion);

export default router;