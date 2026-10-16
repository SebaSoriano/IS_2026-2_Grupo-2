import { z } from 'zod';

// RUT sin puntos y con guion, ej: 12345678-9
// se pasa a mayuscula para que 12345678-k y 12345678-K sean el mismo RUT
export const rut = z.string().regex(/^\d{7,8}-[\dkK]$/, 'Debe ser un RUT con formato 12345678-9').toUpperCase();

// Valida el :rut de la URL
export const rutParamSchema = z.object({
  rut,
});

// Fecha "AAAA-MM-DD" (o ISO completa) que no sea futura; se entrega convertida a Date
const fechaPasada = z.string()
  .refine((valor) => !Number.isNaN(Date.parse(valor)), { message: 'Debe ser una fecha válida', abort: true })
  .refine((valor) => new Date(valor) <= new Date(), 'La fecha no puede ser futura')
  .transform((valor) => new Date(valor));

// PUT /api/usuarios/:rut -> Modificación de usuario.
// Todos los campos son opcionales, pero debe tener al menos uno.
// El RUT es la clave del usuario y no se puede cambiar, por eso no se puede modificar.
export const updateUsuarioSchema = z.object({
  nombre_usuario:   z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
  correo:           z.string().trim().max(100, 'Debe tener como máximo 100 caracteres').regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Debe ser un correo válido'),
  telefono:         z.string().regex(/^\+?\d{8,14}$/, 'Debe tener entre 8 y 14 dígitos (puede empezar con +)'),
  fecha_nacimiento: fechaPasada,
  rol_id:           z.number().int().positive('Debe indicar un rol válido'),
  contrasena:       z.string().min(6, 'Debe tener al menos 6 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
})
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'Debe enviar al menos un campo para modificar');

// Valida la busqueda de usuarios por nombre que hace el pop-up de turnos mientras se escribe.
// El texto llega en la URL despues del "?" como nombre=texto, ej: /api/horarios/usuarios?nombre=luk
// trim quita los espacios de los extremos y se exige al menos un caracter para no traer a todos los usuarios
export const buscarUsuarioQuerySchema = z.object({
  nombre: z.string().trim().min(1, 'Debe escribir al menos un caracter').max(100),
});
