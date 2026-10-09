import { z } from 'zod';
import { rut } from './usuario.schema.js';

// reglas del body de POST /api/auth/login
// si algo no cumple, responde 400 antes de llegar al controlador
export const loginSchema = z.object({
    // el rut viene con formato 12345678-9 y se pasa a mayúscula
    rut_usuario: rut,
    // la contraseña tiene que ser un texto y no puede venir vacía
    // no se usa .trim(): los espacios al inicio o al final podrían ser parte de la contraseña
    contrasena: z.string()
        .min(1, 'La contraseña no puede estar vacía')
        .max(100, 'La contraseña no puede superar los 100 caracteres'),
    // true si la persona marcó "Recordarme", es opcional (si no viene se toma como false)
    // tiene que ser un booleano de verdad: el texto "true" se rechaza
    recordarme: z.boolean().optional(),
});