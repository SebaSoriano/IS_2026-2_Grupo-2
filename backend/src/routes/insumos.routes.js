import { Router } from 'express';
import {
  createInsumo,
  getInsumo,
  listInsumos,
  removeInsumo,
  updateInsumo,
} from '../controllers/insumo.controller.js';

const router = Router();

router.get('/', listInsumos);
router.get('/:id', getInsumo);
router.post('/', createInsumo);
router.put('/:id', updateInsumo);
router.patch('/:id', updateInsumo);
router.delete('/:id', removeInsumo);

export default router;