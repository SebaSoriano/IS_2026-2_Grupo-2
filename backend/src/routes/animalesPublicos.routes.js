import { Router } from 'express';
import { getAnimalesPublico } from '../controllers/animalesPublico.controller.js';

const router = Router();

router.get('/animales', getAnimalesPublico);

export default router;