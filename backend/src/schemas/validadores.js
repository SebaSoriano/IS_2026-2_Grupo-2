// Validadores reutilizables, sin librerías externas.
// Cada validador recibe un valor y devuelve un mensaje de error (texto) o null si el valor es válido.

export const texto = (valor, { min = 1, max = 255 } = {}) => {
  if (typeof valor !== 'string') return 'Debe ser texto';
  const largo = valor.trim().length;
  if (largo < min) return `Debe tener al menos ${min} caracteres`;
  if (largo > max) return `Debe tener como máximo ${max} caracteres`;
  return null;
};

export const entero = (valor, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (!Number.isInteger(valor)) return 'Debe ser un número entero';
  if (valor < min || valor > max) return `Debe estar entre ${min} y ${max}`;
  return null;
};

export const decimal = (valor, { min = 0, max = Number.MAX_VALUE } = {}) => {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'Debe ser un número';
  if (valor < min || valor > max) return `Debe estar entre ${min} y ${max}`;
  return null;
};

export const rut = (valor) =>
  typeof valor === 'string' && /^\d{7,8}-[\dkK]$/.test(valor)
    ? null
    : 'Debe ser un RUT con formato 12345678-9';

export const correo = (valor) =>
  typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
    ? null
    : 'Debe ser un correo válido';

export const telefono = (valor) =>
  typeof valor === 'string' && /^\+?\d{8,15}$/.test(valor)
    ? null
    : 'Debe tener entre 8 y 15 dígitos (puede empezar con +)';

export const fechaNoFutura = (valor) => {
  if (typeof valor !== 'string' || Number.isNaN(Date.parse(valor))) {
    return 'Debe ser una fecha válida (AAAA-MM-DD)';
  }
  if (new Date(valor) > new Date()) return 'La fecha no puede ser futura';
  return null;
};

export const booleanoTexto = (valor) =>
  valor === 'true' || valor === 'false' ? null : 'Debe ser true o false';


// para booleanos que llegan en el body como JSON
export const booleano = (valor) =>
  typeof valor === 'boolean' ? null : 'Debe ser true o false';

const recortar = (v) => v.trim();

// Arma un "schema" a partir de un objeto de reglas. Cumple el rol de z.object() en Zod.
// Cada regla tiene: validar (una función de arriba), opcional (bool) y transformar (opcional).
// Con { parcial: true } todos los campos pasan a ser opcionales (como .partial() en Zod).
// Solo los campos definidos en "reglas" llegan a "datos": cualquier otro campo se descarta.
export const crearSchema = (reglas, { parcial = false } = {}) => (entrada) => {
  if (typeof entrada !== 'object' || entrada === null || Array.isArray(entrada)) {
    return { errores: [{ campo: 'body', mensaje: 'Debe ser un objeto JSON' }], datos: {} };
  }

  const errores = [];
  const datos = {};

  for (const [campo, regla] of Object.entries(reglas)) {
    const valor = entrada[campo];

    if (valor === undefined || valor === null || valor === '') {
      if (!regla.opcional && !parcial) errores.push({ campo, mensaje: 'Campo obligatorio' });
      continue;
    }

    const error = regla.validar(valor);
    if (error) {
      errores.push({ campo, mensaje: error });
    } else {
      const transformar = regla.transformar ?? (typeof valor === 'string' ? recortar : null);
      datos[campo] = transformar ? transformar(valor) : valor;
    }
  }

  return { errores, datos };
};
