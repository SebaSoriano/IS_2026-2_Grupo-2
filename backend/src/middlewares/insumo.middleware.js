import { z } from 'zod';

const requiredFields = ['tipo_insumo', 'fecha_ingreso', 'cantidad', 'rut_usuario'];

const fecha = (campo) => {
  const message = `${campo} debe ser una fecha válida en formato de texto`;

  return z.string({ error: message })
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message })
    .transform((value) => new Date(value));
};

const insumoSchema = z.object({
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

const partialInsumoSchema = insumoSchema.partial();

export function validateInsumoPayload(partial = false) {
  return (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON' });
    }

    const keys = Object.keys(body);
    if (partial && keys.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un campo para modificar' });
    }
    if (!partial && requiredFields.some((field) => !(field in body))) {
      return res.status(400).json({
        error: 'tipo_insumo, fecha_ingreso, cantidad y rut_usuario son obligatorios',
      });
    }

    const result = (partial ? partialInsumoSchema : insumoSchema).safeParse(body);
    if (!result.success) {
      const unknownFields = result.error.issues.find((issue) => issue.code === 'unrecognized_keys');
      if (unknownFields) {
        return res.status(400).json({
          error: `Campos no permitidos: ${unknownFields.keys.join(', ')}`,
        });
      }

      return res.status(400).json({ error: result.error.issues[0].message });
    }

    req.body = result.data;
    return next();
  };
}
