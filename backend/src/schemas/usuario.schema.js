import { z } from 'zod';

// RUT sin puntos y con guion, ej: 12345678-9
export const rut = z.string().regex(/^\d{7,8}-[\dkK]$/, 'Debe ser un RUT con formato 12345678-9');

// Valida el :rut de la URL
export const rutParamSchema = z.object({
  rut,
});
