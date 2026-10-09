const fields = {
  tipo_insumo: {
    required: true,
    validate(value) {
      if (typeof value !== 'string' || value.trim().length === 0) {
        return 'tipo_insumo debe ser un texto no vacío';
      }
      if (value.trim().length > 100) {
        return 'tipo_insumo no puede superar 100 caracteres';
      }
      return null;
    },
    transform: (value) => value.trim(),
  },
  fecha_ingreso: {
    required: true,
    validate: (value) => validateDate(value, 'fecha_ingreso'),
    transform: (value) => new Date(value),
  },
  fecha_vencimiento: {
    validate: (value) => value === null ? null : validateDate(value, 'fecha_vencimiento'),
    transform: (value) => value === null ? null : new Date(value),
  },
  descripcion: {
    validate(value) {
      if (value === null) return null;
      if (typeof value !== 'string') return 'descripcion debe ser texto o null';
      if (value.length > 255) return 'descripcion no puede superar 255 caracteres';
      return null;
    },
  },
  cantidad: {
    required: true,
    validate(value) {
      return Number.isInteger(value) && value >= 0
        ? null
        : 'cantidad debe ser un entero mayor o igual a cero';
    },
  },
  rut_usuario: {
    required: true,
    validate(value) {
      return typeof value === 'string' && value.trim().length > 0
        ? null
        : 'rut_usuario debe ser un texto no vacío';
    },
    transform: (value) => value.trim(),
  },
};

function validateDate(value, field) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
    ? null
    : `${field} debe ser una fecha válida en formato de texto`;
}

function createSchema(partial) {
  return (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {
        errores: [{ campo: 'body', mensaje: 'El cuerpo debe ser un objeto JSON' }],
        datos: {},
      };
    }

    const errores = [];
    const datos = {};

    for (const field of Object.keys(input)) {
      if (!Object.hasOwn(fields, field)) {
        errores.push({ campo: field, mensaje: `Campo no permitido: ${field}` });
      }
    }

    for (const [field, rules] of Object.entries(fields)) {
      if (!Object.hasOwn(input, field)) {
        if (rules.required && !partial) {
          errores.push({ campo: field, mensaje: 'Campo obligatorio' });
        }
        continue;
      }

      const value = input[field];
      const error = rules.validate(value);
      if (error) {
        errores.push({ campo: field, mensaje: error });
      } else {
        datos[field] = rules.transform ? rules.transform(value) : value;
      }
    }

    if (partial && Object.keys(input).length === 0) {
      errores.push({ campo: 'body', mensaje: 'Debe enviar al menos un campo para modificar' });
    }

    return { errores, datos };
  };
}

export const createInsumoSchema = createSchema(false);
export const updateInsumoSchema = createSchema(true);
