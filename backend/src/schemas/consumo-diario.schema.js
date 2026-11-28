import { z } from 'zod'

const insumoConsumoSchema = z.object({
  id_insumo: z.number().int().positive(),
  cantidad: z.number().int().positive().nullable(),
}).strict()

export const createConsumoDiarioSchema = z.object({
  insumos: z.array(insumoConsumoSchema)
    .min(1, 'Incluye al menos un insumo'),
}).strict().superRefine(({ insumos }, ctx) => {
  const ids = new Set()

  insumos.forEach((insumo, index) => {
    if (ids.has(insumo.id_insumo)) {
      ctx.addIssue({
        code: 'custom',
        path: ['insumos', index, 'id_insumo'],
        message: 'No repitas el mismo insumo en el consumo diario',
      })
    }
    ids.add(insumo.id_insumo)
  })
})
