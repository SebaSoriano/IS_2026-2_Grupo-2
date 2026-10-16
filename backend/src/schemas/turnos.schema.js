import { z } from 'zod';
import { rut } from './usuario.schema.js';
import { fechaDesdeTexto } from '../utils/fechas.js';

// Bloque de una hora con formato "HH:00" entre las horas min y max, ej: "08:00"
const bloque = (min, max) =>
  z.string()
    .regex(/^\d{2}:00$/, 'Debe ser un bloque de una hora con formato HH:00')
    .refine((valor) => {
      const h = Number(valor.slice(0, 2));
      return h >= min && h <= max;
    }, `Debe estar entre las ${min}:00 y las ${max}:00`);

// Fecha con formato "AAAA-MM-DD" que se entrega convertida a Date (solo el dia, a las 00:00 UTC)
// abort: si el formato esta mal, no se sigue revisando si la fecha existe
// se compara con el texto original porque JavaScript convierte "2026-02-31" en el 3 de marzo en vez de rechazarla
export const fecha = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Debe ser una fecha con formato AAAA-MM-DD', abort: true })
  .refine((valor) => {
    const convertida = fechaDesdeTexto(valor);
    return !Number.isNaN(convertida.getTime()) && convertida.toISOString().slice(0, 10) === valor;
  }, 'Debe ser una fecha que exista')
  .transform(fechaDesdeTexto);

const turnoSchema = z.object({
  rut_usuario: rut,
  // fecha puntual del turno; el dia de la semana (horario_id) lo calcula el backend
  fecha,
  // hora de llegada, el turno empieza en ese bloque
  hora_inicio: bloque(8, 19),
  // hora de ida, es opcional (null para borrarla al editar)
  hora_fin: bloque(9, 20).nullable().optional(),
});

// la hora de ida debe ser despues de la hora de llegada (los "HH:00" se pueden comparar como texto)
const finDespuesDeInicio = (datos) => !datos.hora_inicio || !datos.hora_fin || datos.hora_fin > datos.hora_inicio;
const mensajeFin = { message: 'La hora de ida debe ser después de la hora de llegada', path: ['hora_fin'] };

// POST /api/turnos: anota a un usuario en un bloque horario de una fecha
export const createTurnoSchema = turnoSchema.refine(finDespuesDeInicio, mensajeFin);

// PUT /api/turnos/:id: todos los campos opcionales, pero debe venir al menos uno
export const updateTurnoSchema = turnoSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'Debe enviar al menos el usuario a cambiar o el bloque horario a cambiar')
  .refine(finDespuesDeInicio, mensajeFin);

// PATCH /api/turnos/:id/asistencia: marca o desmarca que el usuario llego a la hora a su turno
// tiene que ser un booleano de verdad: el texto "true" se rechaza
export const asistenciaTurnoSchema = z.object({
  llego_a_la_hora: z.boolean(),
});

// GET /api/horarios?semana=2026-10-12: cualquier dia de la semana que se quiere ver (el backend busca su lunes)
// si no viene, se muestra la semana actual
export const semanaQuerySchema = z.object({
  semana: fecha.optional(),
});
