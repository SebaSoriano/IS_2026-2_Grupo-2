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

export const unidadMedida = z.enum(['kg', 'g', 'unidad']);
export const estadosInsumo = [
  'Nuevo',
  'Recien usado',
  'A medio usar',
  'Usado',
  'Vencido',
];

function validarUnidadYCantidad(datos, ctx, esCreacion = false) {
  const error = (campo, mensaje) => ctx.addIssue({
    code: 'custom',
    path: [campo],
    message: mensaje,
  });

  const esAlimentacion = datos.tipo_insumo === 'Alimentación';
  if (datos.tipo_insumo && datos.unidad_medida) {
    if (!esAlimentacion && datos.unidad_medida !== 'unidad') {
      error('unidad_medida', 'Este tipo de insumo se registra en unidades');
    }
  }

  if (datos.cantidad !== undefined) {
    const esGramoDeAlimentacion =
      datos.tipo_insumo === 'Alimentación' && datos.unidad_medida === 'g';
    const maximo = esGramoDeAlimentacion ? 99_999 : 99;

    if (datos.cantidad > maximo) {
      error(
        'cantidad',
        esGramoDeAlimentacion
          ? 'La cantidad máxima es 99999 g'
          : 'Para cantidades mayores a 99, selecciona gramos en insumos de alimentación',
      );
    }
  }

  if (esCreacion && !esAlimentacion && datos.unidad_medida !== 'unidad') {
    error('unidad_medida', 'Este tipo de insumo se registra en unidades');
  }
}

const insumoSchema = z.object({
  tipo_insumo: tipoInsumo,
  unidad_medida: unidadMedida,
  marca: z.string()
    .trim()
    .max(100, 'marca no puede superar 100 caracteres')
    .nullable()
    .optional(),
  estado: z.enum(estadosInsumo).optional(),
  fecha_ingreso: fecha,
  fecha_vencimiento: fechaVencimiento.nullable().optional(),
  descripcion: z.string()
    .max(255, 'descripcion no puede superar 255 caracteres')
    .nullable()
    .optional(),
  cantidad: z.number()
    .int('cantidad debe ser un entero')
    .min(0, 'cantidad debe ser mayor o igual a 0')
    .max(99_999, 'cantidad no puede superar 99999'),
  rut_usuario: z.string()
    .trim()
    .min(1, 'rut_usuario debe ser un texto no vacío'),
}).strict();

export const createInsumoSchema = insumoSchema.superRefine((datos, ctx) =>
  validarUnidadYCantidad(datos, ctx, true));
export const updateInsumoSchema = insumoSchema
  .partial()
  .strict()
  .superRefine((datos, ctx) => validarUnidadYCantidad(datos, ctx))
  .refine((data) => Object.keys(data).length > 0, 'Debe enviar al menos un campo para modificar');
