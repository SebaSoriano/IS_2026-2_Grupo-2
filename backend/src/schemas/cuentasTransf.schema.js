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

// PATCH /api/cuentas-transferencia/:id (editar datos o activar/desactivar)
export const updateCuentaSchema = z
  .object({ ...camposCuenta, activa: z.boolean({ error: 'Debe ser true o false' }) })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'Debe enviar al menos un campo para modificar');