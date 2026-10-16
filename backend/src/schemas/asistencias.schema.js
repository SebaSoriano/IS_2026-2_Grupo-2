import { z } from 'zod';

// Valida el mes que se quiere ver en la tabla de asistencia.
// Llega en la URL despues del "?" como mes=AAAA-MM, ej: /api/asistencias?mes=2026-10
// la asistencia se marca en cada turno (PATCH /api/turnos/:id/asistencia)
export const mesQuerySchema = z.object({
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Debe ser un mes con formato AAAA-MM'),
});
