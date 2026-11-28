import { Router } from 'express';
import {
  getAnimalesPublico,
  getSaludAnimalPublico,
} from '../controllers/animalesPublico.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();

router.get('/animales', getAnimalesPublico);
// Resumen de salud que se ve al presionar "Ver detalles".
router.get('/animales/:id/salud', validate(idParamSchema, 'params'), getSaludAnimalPublico);

export default router;