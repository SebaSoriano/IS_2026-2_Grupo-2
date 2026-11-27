import { z } from 'zod';

// Recibe "AAAA-MM-DD" y lo entrega convertido a Date
// abort: si la fecha no es valida, no se sigue revisando si es futura
const fechaNoFutura = z.string()
    .refine((valor) => !Number.isNaN(Date.parse(valor)), { message: 'Debe ser una fecha válida (AAAA-MM-DD)', abort: true })
    .refine((valor) => new Date(valor) <= new Date(), 'La fecha no puede ser futura')
    .transform((valor) => new Date(valor));

// Recibe fecha y hora, ej: "2026-11-20T15:30" (lo que entrega un <input type="datetime-local">)
// y la entrega convertida a Date. Debe ser en el futuro.
const fechaHoraFutura = z.string()
    .refine((valor) => !Number.isNaN(Date.parse(valor)), { message: 'Debe ser una fecha y hora válidas', abort: true })
    .refine((valor) => new Date(valor) > new Date(), 'La visita debe ser en el futuro')
    .transform((valor) => new Date(valor));

// Datos de una persona adoptante (las columnas de la tabla "adoptante")
export const adoptanteSchema = z.object({
    nombre_adoptante: z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
    direccion: z.string().trim().min(5, 'Debe tener al menos 5 caracteres').max(200, 'Debe tener como máximo 200 caracteres'),
    telefono: z.string().trim().regex(/^\+?\d{8,15}$/, 'Debe tener entre 8 y 15 dígitos (puede empezar con +)'),
    correo: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Debe ser un correo válido'),
    fecha_nacimiento: fechaNoFutura,
    observaciones_adoptante: z.string().trim().max(500, 'Debe tener como máximo 500 caracteres').optional(),
});

// POST /api/adopciones/solicitudes (página pública)
// Adoptante + el animal que le interesa (obligatorio)
export const solicitudAdopcionSchema = adoptanteSchema.extend({
    id_animal: z.number().int().positive('Debe elegir un animal'),
});

// POST /api/adopciones/solicitudes/manual (intranet)
// Adoptante + animal OPCIONAL: si no viene, solo se registra la persona
export const ingresoManualSchema = adoptanteSchema.extend({
    id_animal: z.number().int().positive('Debe elegir un animal').optional(),
});

// POST /api/adopciones/solicitudes/existente
// Un adoptante que ya está registrado + un animal disponible
export const solicitudExistenteSchema = z.object({
    id_adoptante: z.number().int().positive('Debe elegir un adoptante'),
    id_animal: z.number().int().positive('Debe elegir un animal'),
});

// PATCH /api/adopciones/solicitudes/:id/visita
export const visitaSchema = z.object({
    fecha_visita: fechaHoraFutura,
});