import { z } from 'zod';

const fecha = z.string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Debe ser una fecha válida')
  .transform((value) => new Date(value));

const tipoInsumo = z.string()
  .trim()
  .pipe(z.enum([
    'Alimentación',
    'Higiene y aseo',
    'Salud',
    'Limpieza',
    'Accesorios y juguetes',
    'Otros',
  ], 'tipo_insumo debe ser uno de los tipos permitidos'));

const insumoSchema = z.object({
  tipo_insumo: tipoInsumo,
  fecha_ingreso: fecha,
  fecha_vencimiento: fecha.nullable().optional(),
  descripcion: z.string()
    .max(255, 'descripcion no puede superar 255 caracteres')
    .nullable()
    .optional(),
  cantidad: z.number()
    .int('cantidad debe ser un entero entre 0 y 99')
    .min(0, 'cantidad debe ser un entero entre 0 y 99')
    .max(99, 'cantidad debe ser un entero entre 0 y 99'),
  rut_usuario: z.string()
    .trim()
    .min(1, 'rut_usuario debe ser un texto no vacío'),
}).strict();

export const createInsumoSchema = insumoSchema;
export const updateInsumoSchema = insumoSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Debe enviar al menos un campo para modificar');
