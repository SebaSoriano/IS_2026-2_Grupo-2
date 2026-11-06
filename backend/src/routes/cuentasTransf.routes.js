import { Router } from 'express';
import * as c from '../controllers/cuentasTransf.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCuentaSchema, updateCuentaSchema } from '../schemas/cuentasTransf.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';

const router = Router();

router.get('/publicas', c.getCuentasPublicas); // público: lo usa el formulario de donación
router.get('/', c.getCuentas);                 // interno
router.post('/', validate(createCuentaSchema), c.createCuenta);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateCuentaSchema), c.updateCuenta);

export default router;