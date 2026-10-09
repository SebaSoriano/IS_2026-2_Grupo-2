import { z } from 'zod';

// RUT sin puntos y con guion, ej: 12345678-9
// se pasa a mayuscula para que 12345678-k y 12345678-K sean el mismo RUT
export const rut = z.string().regex(/^\d{7,8}-[\dkK]$/, 'Debe ser un RUT con formato 12345678-9').toUpperCase();

// Valida el :rut de la URL
export const rutParamSchema = z.object({
  rut,
});
