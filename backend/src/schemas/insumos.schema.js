import { z } from 'zod';

const fecha = z.string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Debe ser una fecha válida')
  .transform((value) => new Date(value));

const insumoSchema = z.object({
  tipo_insumo: z.string()
    .trim()
    .min(1, 'tipo_insumo debe ser un texto no vacío')
    .max(100, 'tipo_insumo no puede superar 100 caracteres'),
  fecha_ingreso: fecha,
  fecha_vencimiento: fecha.nullable().optional(),
  descripcion: z.string()
    .max(255, 'descripcion no puede superar 255 caracteres')
    .nullable()
    .optional(),
  cantidad: z.number()
    .int('cantidad debe ser un entero mayor o igual a cero')
    .min(0, 'cantidad debe ser un entero mayor o igual a cero'),
  rut_usuario: z.string()
    .trim()
    .min(1, 'rut_usuario debe ser un texto no vacío'),
}).strict();

export const createInsumoSchema = insumoSchema;
export const updateInsumoSchema = insumoSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Debe enviar al menos un campo para modificar');
