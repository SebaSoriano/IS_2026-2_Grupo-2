import { Router } from 'express';
import {
  createInsumo,
  getInsumo,
  listInsumos,
  listMovimientos,
  removeInsumo,
  terminarEnvase,
  updateInsumo,
} from '../controllers/insumo.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createInsumoSchema, updateInsumoSchema } from '../schemas/insumos.schema.js';

const router = Router();

router.get('/', listInsumos);
router.get('/movimientos', listMovimientos);
router.get('/:id', getInsumo);
router.post('/', validate(createInsumoSchema), createInsumo);
router.put('/:id', validate(updateInsumoSchema), updateInsumo);
router.patch('/:id', validate(updateInsumoSchema), updateInsumo);
router.delete('/:id', removeInsumo);
router.patch('/:id/terminar', terminarEnvase);

export default router;