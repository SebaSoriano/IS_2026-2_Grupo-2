import { z } from 'zod';

// Tipos de donación aceptadas
export const TIPOS_DONACION = ['dinero', 'alimento', 'insumos', 'otro'];

// POST /api/donaciones
export const createDonacionSchema = z
  .object({
    tipo_donacion: z.enum(TIPOS_DONACION, {
      error: `Debe ser uno de: ${TIPOS_DONACION.join(', ')}`,
    }),

    // Monto en clp
    monto_donacion: z
      .number({ error: 'Debe ser un número' })
      .int('Debe ser un número entero')
      .positive('Debe ser mayor a 0')
      .max(100_000_000, 'El monto es demasiado alto')
      .optional(),

    // Si no hay fecha ocupa la actual
    fecha_donacion: z.coerce
      .date({ error: 'Debe ser una fecha válida (AAAA-MM-DD)' })
      .refine((fecha) => fecha <= new Date(), 'La fecha no puede ser futura')
      .optional(),

    rut_usuario: z
      .string()
      .trim()
      .regex(/^\d{7,8}-[\dkK]$/, 'Debe ser un RUT con formato 12345678-9'),
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo_donacion === 'dinero' && datos.monto_donacion === undefined) {
        //Validando donaciones monetarias
      ctx.addIssue({
        code: 'custom',
        path: ['monto_donacion'],
        message: 'El monto es obligatorio para donaciones en dinero',
      });
    }
    if (datos.tipo_donacion !== 'dinero' && datos.monto_donacion !== undefined) {
        //Validando que donaciones NO monetarias no tengan monto
      ctx.addIssue({
        code: 'custom',
        path: ['monto_donacion'],
        message: 'El monto solo aplica a donaciones en dinero',
      });
    }
  });