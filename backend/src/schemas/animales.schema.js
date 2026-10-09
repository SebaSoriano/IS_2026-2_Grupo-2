import { z } from 'zod';

// Reglas para las columnas que HOY tiene la tabla "animales".
// Mientras no exista una columna propia, el estado general se escribe en observaciones_animal.
const animalSchema = z.object({
  especie_animal:       z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
  via_ingreso:          z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
  edad:                 z.number().int('Debe ser un número entero').min(0).max(40),      // edad estimada, en años
  peso_animal:          z.number().min(0.01).max(150),                                   // en kg
  observaciones_animal: z.string().trim().max(1000, 'Debe tener como máximo 1000 caracteres').optional(),
});

// POST /api/animales
export const createAnimalSchema = animalSchema;

// PUT /api/animales/🆔 todos los campos opcionales, pero debe venir al menos uno
export const updateAnimalSchema = animalSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'Debe enviar al menos un campo para modificar');

// GET /api/animales?especie=perro&adoptado=true
// en la query todo llega como texto, por eso adoptado se transforma de 'true'/'false' a booleano
export const filterAnimalSchema = z.object({
  especie:  z.string().trim().max(100, 'Debe tener como máximo 100 caracteres').optional(),
  adoptado: z.enum(['true', 'false'], 'Debe ser true o false').transform((valor) => valor === 'true').optional(),
});