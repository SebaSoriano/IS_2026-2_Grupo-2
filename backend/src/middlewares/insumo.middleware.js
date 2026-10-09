import { createInsumoSchema, updateInsumoSchema } from '../schemas/insumos.schema.js';

const requiredFields = ['tipo_insumo', 'fecha_ingreso', 'cantidad', 'rut_usuario'];

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

    const result = (partial ? updateInsumoSchema : createInsumoSchema).safeParse(body);
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
