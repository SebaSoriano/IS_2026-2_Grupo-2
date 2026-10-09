import { z } from 'zod';

// Valida el :id de la URL y lo convierte de texto ("7") a número (7)
export const idParamSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'El id debe ser un número entero positivo').transform(Number),
});
