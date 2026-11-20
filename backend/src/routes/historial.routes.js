import { Router } from 'express';
import {
  getHistoriales,
  getVeterinarios,
  getHistorialPdf,
  getHistorialById,
  createHistorial,
  updateHistorial,
  deleteHistorial,
} from '../controllers/historial.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createHistorialSchema,
  updateHistorialSchema,
  filterHistorialSchema,
} from '../schemas/historial.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();

// cada ruta pasa primero por validate y recién después llega al controlador
// si los datos no cumplen las reglas, validate responde 400 y el controlador nunca se ejecuta.
router.get('/', validate(filterHistorialSchema, 'query'), getHistoriales);
// /veterinarios va ANTES de /:id: Express revisa las rutas en orden y, si fuera después,
// "veterinarios" se tomaría como si fuera un id (y idParamSchema respondería 400).
router.get('/veterinarios', getVeterinarios);
// PDF de la tabla: usa los mismos filtros que GET / (por eso el mismo schema)
router.get('/pdf', validate(filterHistorialSchema, 'query'), getHistorialPdf);
router.get('/:id', validate(idParamSchema, 'params'), getHistorialById);
router.post('/', validate(createHistorialSchema, 'body'), createHistorial);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateHistorialSchema, 'body'), updateHistorial);
router.delete('/:id', validate(idParamSchema, 'params'), deleteHistorial);

export default router;