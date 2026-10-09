import { z } from 'zod';

const fecha = (campo) => {
  const message = `${campo} debe ser una fecha válida en formato de texto`;

  return z.string({ error: message })
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message })
    .transform((value) => new Date(value));
};

export const createInsumoSchema = z.object({
  tipo_insumo: z.string({ error: 'tipo_insumo debe ser un texto no vacío' })
    .trim()
    .min(1, { message: 'tipo_insumo debe ser un texto no vacío' })
    .max(100, { message: 'tipo_insumo no puede superar 100 caracteres' }),
  fecha_ingreso: fecha('fecha_ingreso'),
  fecha_vencimiento: fecha('fecha_vencimiento').nullable().optional(),
  descripcion: z.custom(
    (value) => value === null || typeof value === 'string',
    { message: 'descripcion debe ser texto o null' },
  ).refine(
    (value) => typeof value !== 'string' || value.length <= 255,
    { message: 'descripcion no puede superar 255 caracteres' },
  ).optional(),
  cantidad: z.number({ error: 'cantidad debe ser un entero mayor o igual a cero' })
    .refine(
      (value) => Number.isInteger(value) && value >= 0,
      { message: 'cantidad debe ser un entero mayor o igual a cero' },
    ),
  rut_usuario: z.string({ error: 'rut_usuario debe ser un texto no vacío' })
    .trim()
    .min(1, { message: 'rut_usuario debe ser un texto no vacío' }),
}).strict();

export const updateInsumoSchema = createInsumoSchema.partial();
