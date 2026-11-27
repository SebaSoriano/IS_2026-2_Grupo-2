import { Router } from 'express';
import * as c from '../controllers/cuentasTransf.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCuentaSchema, updateCuentaSchema, updateCuentaPropiaSchema } from '../schemas/cuentasTransf.schema.js';
import { idParamSchema } from '../schemas/idParam.schema.js';
import { requireAuth, requireRol } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const validarCambiosCuenta = (req, res, next) => {
  const schema = req.usuario.rol === ROLES.ADMIN ? updateCuentaSchema : updateCuentaPropiaSchema;
  return validate(schema)(req, res, next);
};
const router = Router();

router.get('/publicas', c.getCuentasPublicas); // público: lo usa el formulario de donación
router.use(requireAuth);
router.get('/', c.getCuentas);                 // interno
router.post('/', requireRol(ROLES.ADMIN), validate(createCuentaSchema), c.createCuenta);
router.patch('/:id', requireRol(...Object.values(ROLES)), validate(idParamSchema, 'params'), validarCambiosCuenta, c.updateCuenta);
router.delete('/:id', requireRol(ROLES.ADMIN), validate(idParamSchema, 'params'), c.deleteCuenta);

export default router;