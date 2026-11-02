import { z } from 'zod';

const fecha = z.string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Debe ser una fecha válida')
  .transform((value) => new Date(value));

function getTodayDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const fechaVencimiento = z.string()
  .refine(isValidDateOnly, 'Debe ser una fecha válida')
  .pipe(z.string().refine(
    (value) => value >= getTodayDateString(),
    'La fecha de vencimiento no puede ser anterior al día actual',
  ))
  .transform((value) => new Date(value));


export const tipoInsumo = z.string()
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
  fecha_vencimiento: fechaVencimiento.nullable().optional(),
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
