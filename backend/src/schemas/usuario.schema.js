import { z } from 'zod';

// RUT sin puntos y con guion, ej: 12345678-9
// se pasa a mayuscula para que 12345678-k y 12345678-K sean el mismo RUT
export const rut = z.string().regex(/^\d{7,8}-[\dkK]$/, 'Debe ser un RUT con formato 12345678-9').toUpperCase();

// Valida el :rut de la URL
export const rutParamSchema = z.object({
  rut,
});

// Valida la busqueda de usuarios por nombre que hace el pop-up de turnos mientras se escribe.
// El texto llega en la URL despues del "?" como nombre=texto, ej: /api/horarios/usuarios?nombre=luk
// trim quita los espacios de los extremos y se exige al menos un caracter para no traer a todos los usuarios
export const buscarUsuarioQuerySchema = z.object({
  nombre: z.string().trim().min(1, 'Debe escribir al menos un caracter').max(100),
});
