import { z } from 'zod';

// El nombre debe tener al menos 3 caracteres y como máximo 100
export const createProcedimientoSchema = z
  .object({
    nombre: z
      .string({ error: 'El nombre es obligatorio' })
      .trim()
      .min(3, 'Debe tener al menos 3 caracteres')
      .max(100, 'Debe tener como máximo 100 caracteres'),
  })
  .strict();