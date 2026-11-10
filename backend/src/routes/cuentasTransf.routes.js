import { Router } from 'express';
import * as c from '../controllers/cuentasTransf.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCuentaSchema, updateCuentaSchema } from '../schemas/cuentasTransf.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';
import { requireAuth, requireRol } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();

router.get('/publicas', c.getCuentasPublicas); // público: lo usa el formulario de donación
router.use(requireAuth);
router.get('/', c.getCuentas);                 // interno
router.post('/', requireRol(ROLES.ADMIN), validate(createCuentaSchema), c.createCuenta);
router.patch('/:id', requireRol(ROLES.ADMIN), validate(idParamSchema, 'params'), validate(updateCuentaSchema), c.updateCuenta);

export default router;