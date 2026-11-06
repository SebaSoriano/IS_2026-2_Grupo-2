import { Router } from 'express';
import { getUsuarios, updateUsuario, deleteUsuario } from '../controllers/usuario.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import { rutParamSchema, updateUsuarioSchema } from '../schemas/usuario.schema.js';

const router = Router();

router.get('/', getUsuarios);
router.put('/:rut', validate(rutParamSchema, 'params'), validate(updateUsuarioSchema, 'body'), updateUsuario);
router.delete('/:rut', validate(rutParamSchema, 'params'), deleteUsuario);

export default router;