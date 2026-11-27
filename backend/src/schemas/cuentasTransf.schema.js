import { z } from 'zod';
import { rut } from './donaciones.schema.js';

export const TIPOS_CUENTA = ['corriente', 'vista', 'ahorro', 'rut'];

const camposCuenta = {
  banco: z.string().trim().min(1, 'No puede estar vacío').max(100),
  tipo_cuenta: z.enum(TIPOS_CUENTA, { error: `Debe ser uno de: ${TIPOS_CUENTA.join(', ')}` }),
  numero_cuenta: z.string().trim().regex(/^\d{4,20}$/, 'Solo dígitos (entre 4 y 20)'),
  titular_nombre: z.string().trim().min(1, 'No puede estar vacío').max(100),
  titular_rut: rut,
  correo: z.email('Correo inválido').max(100).optional(),
};

// POST /api/cuentas-transferencia
export const createCuentaSchema = z.object({ ...camposCuenta, rut_usuario: rut }).strict();

// En una modificación el correo se puede borrar mandando null
const camposCuentaEditables = {
  ...camposCuenta,
  correo: z.email('Correo inválido').max(100).nullable(),
};

const alMenosUnCampo = (d) => Object.keys(d).length > 0;

// PATCH /api/cuentas-transferencia/:id del Admin: puede cambiar todo, incluido el responsable y si está activa
export const updateCuentaSchema = z
  .object({ ...camposCuentaEditables, rut_usuario: rut, activa: z.boolean({ error: 'Debe ser true o false' }) })
  .partial()
  .strict()
  .refine(alMenosUnCampo, 'Debe enviar al menos un campo para modificar');

// PATCH del voluntario responsable: solo los datos bancarios de su propia cuenta
export const updateCuentaPropiaSchema = z
  .object(camposCuentaEditables)
  .partial()
  .strict()
  .refine(alMenosUnCampo, 'Debe enviar al menos un campo para modificar');