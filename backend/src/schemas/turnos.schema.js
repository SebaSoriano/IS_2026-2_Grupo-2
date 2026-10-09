import { z } from 'zod';
import { rut } from './usuario.schema.js';

// Bloque de una hora con formato "HH:00" entre las horas min y max, ej: "08:00"
const bloque = (min, max) =>
  z.string()
    .regex(/^\d{2}:00$/, 'Debe ser un bloque de una hora con formato HH:00')
    .refine((valor) => {
      const h = Number(valor.slice(0, 2));
      return h >= min && h <= max;
    }, `Debe estar entre las ${min}:00 y las ${max}:00`);

const turnoSchema = z.object({
  rut_usuario: rut,
  // el id del horario es el dia de la semana (1 = Lunes ... 7 = Domingo)
  horario_id: z.number().int().min(1, 'Debe ser un día entre 1 (Lunes) y 7 (Domingo)').max(7, 'Debe ser un día entre 1 (Lunes) y 7 (Domingo)'),
  // hora de llegada, el turno empieza en ese bloque
  hora_inicio: bloque(8, 19),
  // hora de ida, es opcional (null para borrarla al editar)
  hora_fin: bloque(9, 20).nullable().optional(),
});

// la hora de ida debe ser despues de la hora de llegada (los "HH:00" se pueden comparar como texto)
const finDespuesDeInicio = (datos) => !datos.hora_inicio || !datos.hora_fin || datos.hora_fin > datos.hora_inicio;
const mensajeFin = { message: 'La hora de ida debe ser después de la hora de llegada', path: ['hora_fin'] };

// POST /api/turnos: asigna un usuario a un bloque horario de un dia
export const createTurnoSchema = turnoSchema.refine(finDespuesDeInicio, mensajeFin);

// PUT /api/turnos/:id: todos los campos opcionales, pero debe venir al menos uno
export const updateTurnoSchema = turnoSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'Debe enviar al menos el usuario a cambiar o el bloque horario a cambiar')
  .refine(finDespuesDeInicio, mensajeFin);
