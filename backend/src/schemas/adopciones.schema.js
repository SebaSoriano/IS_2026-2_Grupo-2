import { z } from 'zod';
import { rut } from './usuario.schema.js';

// Recibe "AAAA-MM-DD" y lo entrega convertido a Date
// abort: si la fecha no es valida, no se sigue revisando si es futura
const fechaNoFutura = z.string()
    .refine((valor) => !Number.isNaN(Date.parse(valor)), { message: 'Debe ser una fecha válida (AAAA-MM-DD)', abort: true })
    .refine((valor) => new Date(valor) <= new Date(), 'La fecha no puede ser futura')
    .transform((valor) => new Date(valor));

export const createAdopcionSchema = z.object({
    //Datos de la adopcion
    fecha_adopcion: fechaNoFutura,
    rut_usuario: rut,

    //Datos del adoptante
    nombre_adoptante: z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
    direccion: z.string().trim().min(5, 'Debe tener al menos 5 caracteres').max(200, 'Debe tener como máximo 200 caracteres'),
    telefono: z.string().regex(/^\+?\d{8,15}$/, 'Debe tener entre 8 y 15 dígitos (puede empezar con +)'),
    correo: z.string().regex(/^[^\s@]+@[^\s@]+.[^\s@]+$/, 'Debe ser un correo válido'),
    fecha_nacimiento: fechaNoFutura,
    observaciones_adoptante: z.string().trim().max(500, 'Debe tener como máximo 500 caracteres').optional(),

})