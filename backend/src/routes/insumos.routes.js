import { Router } from 'express';
import {
  createInsumo,
  getInsumo,
  listInsumos,
  removeInsumo,
  updateInsumo,
} from '../controllers/insumo.controller.js';
import { validateInsumoPayload } from '../middlewares/insumo.middleware.js';

const router = Router();

router.get('/', listInsumos);
router.get('/:id', getInsumo);
router.post('/', validateInsumoPayload(), createInsumo);
router.put('/:id', validateInsumoPayload(true), updateInsumo);
router.patch('/:id', validateInsumoPayload(true), updateInsumo);
router.delete('/:id', removeInsumo);

export default router;