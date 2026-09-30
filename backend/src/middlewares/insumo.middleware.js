const fields = new Set([
  'tipo_insumo',
  'fecha_ingreso',
  'fecha_vencimiento',
  'descripcion',
  'cantidad',
  'rut_usuario',
]);

export function validateInsumoPayload(partial = false) {
  return (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON' });
    }

    const keys = Object.keys(body);
    const unknownFields = keys.filter((key) => !fields.has(key));
    if (unknownFields.length) {
      return res.status(400).json({ error: `Campos no permitidos: ${unknownFields.join(', ')}` });
    }
    if (!partial && ['tipo_insumo', 'fecha_ingreso', 'cantidad', 'rut_usuario'].some((key) => !(key in body))) {
      return res.status(400).json({ error: 'tipo_insumo, fecha_ingreso, cantidad y rut_usuario son obligatorios' });
    }
    if (partial && keys.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un campo para modificar' });
    }

    const data = {};
    for (const key of keys) {
      const value = body[key];

      if (key === 'tipo_insumo' || key === 'rut_usuario') {
        if (typeof value !== 'string' || !value.trim()) {
          return res.status(400).json({ error: `${key} debe ser un texto no vacío` });
        }
        const maxLength = key === 'tipo_insumo' ? 100 : undefined;
        if (maxLength && value.trim().length > maxLength) {
          return res.status(400).json({ error: `${key} no puede superar ${maxLength} caracteres` });
        }
        data[key] = value.trim();
      } else if (key === 'descripcion') {
        if (value !== null && typeof value !== 'string') {
          return res.status(400).json({ error: 'descripcion debe ser texto o null' });
        }
        if (typeof value === 'string' && value.length > 255) {
          return res.status(400).json({ error: 'descripcion no puede superar 255 caracteres' });
        }
        data[key] = value;
      } else if (key === 'cantidad') {
        if (!Number.isInteger(value) || value < 0) {
          return res.status(400).json({ error: 'cantidad debe ser un entero mayor o igual a cero' });
        }
        data[key] = value;
      } else if (key === 'fecha_vencimiento' && value === null) {
        data[key] = null;
      } else {
        const date = new Date(value);
        if (typeof value !== 'string' || Number.isNaN(date.getTime())) {
          return res.status(400).json({ error: `${key} debe ser una fecha válida en formato de texto` });
        }
        data[key] = date;
      }
    }

    req.body = data;
    next();
  };
}