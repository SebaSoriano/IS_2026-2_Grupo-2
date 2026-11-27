import { z } from 'zod';
import { fecha } from './turnos.schema.js';
import { hoy, formatoPeriodo, inicioPeriodo, finPeriodo } from '../utils/fechas.js';

// reglas para las columnas de la tabla "historial_medico" que se pueden escribir.
// los largos máximos son los mismos que define schema.prisma (VarChar(100), VarChar(500)),
// el id_historial no aparece porque lo genera la base de datos (autoincrement).
const historialSchema = z.object({
  id_animal:         z.number().int('Debe ser un número entero').positive('Debe ser un número entero positivo'),
  tratamiento:       z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(500, 'Debe tener como máximo 500 caracteres'),
  // se revisa el formato AAAA-MM-DD, que el día exista y lo entrega convertido a Date.
  fecha_tratamiento: fecha.refine((valor) => valor <= hoy(), 'La fecha no puede ser futura'),
  veterinario:       z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Debe tener como máximo 100 caracteres'),
  // null permite borrar las observaciones al editar
  observaciones:     z.string().trim().max(500, 'Debe tener como máximo 500 caracteres').nullable().optional(),
});

// un insumo usado en el tratamiento: cuál es (su id en la tabla Insumo) y cuánto se usó.
// La cantidad va en la unidad de medida del insumo (unidades, kg o g).
// El mínimo es 1 y el máximo es el mismo que acepta el inventario (99999, ver insumos.schema.js).
// La cantidad es opcional (o null) porque los insumos de tipo "estado" (un frasco, un bidón)
// no miden cuánto se usó: solo se registra que se usaron. Qué insumo necesita cantidad
// no se puede saber aquí sin consultar la base de datos, así que lo revisa historial.service.js,
// igual que si alcanza el stock (eso depende de cuánto haya justo en el momento de guardar).
const insumoUsadoSchema = z.object({
  id_insumo: z.number().int('Debe ser un número entero').positive('Debe ser un número entero positivo'),
  cantidad:  z.number().int('Debe ser un número entero').positive('Debe usar al menos 1').max(99_999, 'No puede superar 99999')
    .nullable()
    .optional(),
});

// lista de insumos usados
const insumosUsadosSchema = z
  .array(insumoUsadoSchema)
  .max(50, 'No se pueden registrar más de 50 insumos en un registro')
  .refine(
    (insumos) => new Set(insumos.map((insumo) => insumo.id_insumo)).size === insumos.length,
    'No se puede repetir un insumo: suma las cantidades en una sola fila',
  );

// POST /api/historial: las columnas del registro más la lista de insumos usados.
export const createHistorialSchema = historialSchema.extend({
  insumos: insumosUsadosSchema.default([]),
});

// PUT /api/historial/:id: todos los campos pasan a ser opcionales (partial).
// Si viene "insumos", es la lista COMPLETA de insumos que debe quedar en el registro:
// historial.service.js la compara con la lista anterior y ajusta el inventario por la diferencia.
// Si no viene, los insumos del registro no se tocan. Por eso aquí no lleva .default([]):
// un default haría que un PUT que solo corrige la fecha le borrara al registro sus insumos.
export const updateHistorialSchema = historialSchema
  .extend({ insumos: insumosUsadosSchema })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'Debe enviar al menos un campo para modificar');


// Valida un periodo (AAAA, AAAA-MM o AAAA-MM-DD) y que la fecha exista de verdad.
const periodo = z.string()
  .regex(formatoPeriodo, { message: 'Debe tener formato AAAA, AAAA-MM o AAAA-MM-DD', abort: true })
  .refine((valor) => inicioPeriodo(valor).toISOString().startsWith(valor), 'La fecha no existe');

export const filterHistorialSchema = z.object({
  animal:      z.string().trim().max(100, 'Debe tener como máximo 100 caracteres').optional(),
  veterinario: z.string().trim().max(100, 'Debe tener como máximo 100 caracteres').optional(),
  desde:       periodo.transform(inicioPeriodo).optional(),
  hasta:       periodo.transform(finPeriodo).optional(),
  limite:      z.coerce.number().int('Debe ser un número entero').min(1).max(100).default(15),
  pagina:      z.coerce.number().int('Debe ser un número entero').min(1).default(1),
})
// .refine al final del objeto puede comparar dos campos a la vez: "desde" no puede ser posterior a "hasta".
  // Como "hasta" ya quedó corrido al periodo siguiente, basta con que "desde" sea menor.
.refine(
    (filtros) => !filtros.desde || !filtros.hasta || filtros.desde < filtros.hasta,
    { message: 'La fecha "desde" no puede ser posterior a "hasta"', path: ['desde'] },
  );