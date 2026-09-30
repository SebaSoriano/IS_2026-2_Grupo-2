import { Router } from 'express';
import insumosRouter from './insumos.routes.js';

const router = Router();

router.use('/insumos', insumosRouter);

export default router;