import { z } from 'zod';

// Estados de un animal (los mismos del enum EstadoAnimal de schema.prisma)
export const ESTADOS_ANIMAL = ['disponible', 'en_proceso', 'adoptado', 'fallecido'];

// Sexo de un animal (los mismos del enum SexoAnimal de schema.prisma)
export const SEXOS_ANIMAL = ['macho', 'hembra'];

// Desde "Modificar Animal" solo se puede marcar como disponible o fallecido.
// "en_proceso" y "adoptado" los pone el backend desde la sección Adopción.
const ESTADOS_EDITABLES = ['disponible', 'fallecido'];

// Reglas para las columnas que se escriben desde el formulario de animales.
// El estado de salud se escribe en observaciones_animal.
const animalSchema = z.object({
  nombre_animal:        z.string().trim().min(1, 'Campo obligatorio').max(100, 'Debe tener como máximo 100 caracteres'),
  especie_animal:       z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
  sexo_animal:          z.enum(SEXOS_ANIMAL, 'Debe elegir macho o hembra'),
  via_ingreso:          z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
  edad:                 z.number().int('Debe ser un número entero').min(0).max(40),      // edad estimada, en años
  peso_animal:          z.number().min(0.01).max(150),                                   // en kg
  observaciones_animal: z.string().trim().max(1000, 'Debe tener como máximo 1000 caracteres').optional(),
});

// POST /api/animales
export const createAnimalSchema = animalSchema;

// PUT /api/animales/:id → todos los campos opcionales (también el estado), pero debe venir al menos uno
export const updateAnimalSchema = animalSchema
  .extend({
    estado_animal: z.enum(ESTADOS_EDITABLES, 'Solo se puede marcar como disponible o fallecido'),
  })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'Debe enviar al menos un campo para modificar');

// GET /api/animales?nombre=fi&especie=perro&via_ingreso=Rescate&estado=disponible&edad_min=1&edad_max=5
// En la query todo llega como texto:
// - z.coerce.number() convierte "3" en 3 antes de revisar que sea un entero
export const filterAnimalSchema = z.object({
  nombre:      z.string().trim().max(100, 'Debe tener como máximo 100 caracteres').optional(),
  especie:     z.string().trim().max(100, 'Debe tener como máximo 100 caracteres').optional(),
  via_ingreso: z.string().trim().max(100, 'Debe tener como máximo 100 caracteres').optional(),
  estado:      z.enum(ESTADOS_ANIMAL, 'Estado no válido').optional(),
  edad_min:    z.coerce.number().int('Debe ser un número entero').min(0, 'No puede ser negativa').optional(),
  edad_max:    z.coerce.number().int('Debe ser un número entero').min(0, 'No puede ser negativa').optional(),
}).refine(
  (filtros) => filtros.edad_min === undefined || filtros.edad_max === undefined || filtros.edad_min <= filtros.edad_max,
  { message: 'La edad mínima no puede ser mayor que la máxima', path: ['edad_min'] },
);