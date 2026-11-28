import { Router } from 'express';
import {
  getProcedimientos,
  createProcedimiento,
  deleteProcedimiento,
} from '../controllers/procedimientos.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createProcedimientoSchema } from '../schemas/procedimientos.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();

// DELETE (borrar un procedimiento) es solo de Admin y Veterinaria; al Voluntario
// requireEdicion le responde 403.
router.get('/', getProcedimientos);
router.post('/', validate(createProcedimientoSchema, 'body'), createProcedimiento);
router.delete('/:id', validate(idParamSchema, 'params'), deleteProcedimiento);

export default router;