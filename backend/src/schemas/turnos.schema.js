import { z } from 'zod';
import { rut, rutParamSchema } from './usuario.schema.js';
import { idParamSchema } from './idParam.schema.js';

// POST /api/turnos: asigna un usuario a un bloque horario
export const createTurnoSchema = z.object({
  rut_usuario: rut,
  horario_id: z.number().int().positive('Debe indicar un horario válido'),
});

// PUT /api/turnos/:rut/:horario_id: cambia el usuario y/o el bloque horario, debe venir al menos uno
export const updateTurnoSchema = createTurnoSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'Debe enviar al menos el usuario a cambiar o el bloque horario a cambiar');

// Un turno se identifica por su clave compuesta: rut del usuario + id del horario
// reutiliza la validacion del rut y la del id (convierte "3" a 3)
export const turnoParamSchema = rutParamSchema.extend({
  horario_id: idParamSchema.shape.id,
});
