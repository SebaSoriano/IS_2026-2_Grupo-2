import { Router } from 'express';
import {
  createDonacion,
  getDonaciones,
  getDonacionById,
} from '../controllers/donaciones.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDonacionSchema } from '../schemas/donaciones.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();

router.get('/', getDonaciones);
router.get('/:id', validate(idParamSchema, 'params'), getDonacionById);
router.post('/', validate(createDonacionSchema, 'body'), createDonacion);

export default router;