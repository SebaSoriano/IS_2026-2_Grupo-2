import { z } from 'zod';
import { rut } from './usuario.schema.js';

// Valida el mes que se quiere ver en la tabla de asistencia.
// Llega en la URL despues del "?" como mes=AAAA-MM, ej: /api/asistencias?mes=2026-10
export const mesQuerySchema = z.object({
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Debe ser un mes con formato AAAA-MM'),
});

// POST /api/asistencias: marca que el usuario llego a la hora ese dia
// la fecha llega como "AAAA-MM-DD" y se entrega convertida a Date
export const createAsistenciaSchema = z.object({
  rut_usuario: rut,
  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Debe ser una fecha con formato AAAA-MM-DD')
    .refine((valor) => !Number.isNaN(Date.parse(valor)), 'Debe ser una fecha valida')
    .transform((valor) => new Date(valor)),
});
