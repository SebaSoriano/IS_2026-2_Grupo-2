import { z } from 'zod';
import { rut } from './usuario.schema.js';

// POST /api/turnos: asigna un usuario a un bloque horario
export const createTurnoSchema = z.object({
  rut_usuario: rut,
  horario_id: z.number().int().positive('Debe indicar un horario válido'),
});
