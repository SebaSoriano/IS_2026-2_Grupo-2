import { Router } from 'express';
import { getAdopciones } from '../controllers/adopciones.controller.js';

const router = Router();

router.get('/', getAdopciones);

export default router;