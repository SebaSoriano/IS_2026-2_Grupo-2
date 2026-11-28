import prisma from '../config/prisma.js'
import { HttpError } from '../middlewares/error.middleware.js'
import { isLowStock, sendLowStockNotification } from './email.service.js'

const incluirConsumoDiario = {
  usuario: {
    select: { rut_usuario: true, nombre_usuario: true },
  },
  insumos: {
    include: {
      insumo: {
        select: {
          id: true,
          tipo_insumo: true,
          descripcion: true,
          unidad_medida: true,
          tipo_control: true,
          cantidad: true,
          estado_envase: true,
        },
      },
    },
  },
}

const textoUnidad = (unidad_medida) => (
  unidad_medida === 'unidad' ? 'unidades' : unidad_medida
)

const errorStockInsuficiente = (insumo, cantidad) => {
  const nombre = insumo.descripcion ?? insumo.tipo_insumo
  const unidad = textoUnidad(insumo.unidad_medida)

  return new HttpError(
    409,
    `No hay stock suficiente de "${nombre}": hacen falta ${cantidad} ${unidad} y en el inventario quedan ${insumo.cantidad} ${unidad}`,
  )
}

async function validarInsumos(tx, insumos) {
  const ids = insumos.map(({ id_insumo }) => id_insumo)
  if (new Set(ids).size !== ids.length) {
    throw new HttpError(400, 'No repitas el mismo insumo en el consumo diario')
  }

  const filas = await tx.insumo.findMany({ where: { id: { in: ids } } })
  const insumoPorId = new Map(filas.map((insumo) => [insumo.id, insumo]))

  return insumos.map(({ id_insumo, cantidad }) => {
    const insumo = insumoPorId.get(id_insumo)
    if (!insumo) {
      throw new HttpError(400, `El insumo con id ${id_insumo} no existe en el inventario`)
    }

    if (insumo.tipo_control === 'estado') {
      if (cantidad !== null) {
        throw new HttpError(400, `El insumo "${insumo.descripcion ?? insumo.tipo_insumo}" se registra sin cantidad`)
      }
      if (insumo.cantidad === 0 || insumo.estado_envase === 'terminado') {
        throw new HttpError(
          409,
          `"${insumo.descripcion ?? insumo.tipo_insumo}" está terminado: no quedan envases en el inventario`,
        )
      }
      if (insumo.estado_envase !== 'cerrado' && insumo.estado_envase !== 'abierto') {
        throw new HttpError(409, `El estado del envase de "${insumo.descripcion ?? insumo.tipo_insumo}" no es válido`)
      }
    } else if (cantidad === null) {
      throw new HttpError(400, `Indica cuánto se usó de "${insumo.descripcion ?? insumo.tipo_insumo}"`)
    }

    return { id_insumo, cantidad, insumo }
  })
}

async function registrarUsoDeEnvase(tx, insumo) {
  const estadoEsperado = insumo.estado_envase
  const data = estadoEsperado === 'cerrado'
    ? { estado_envase: 'abierto', fecha_apertura: new Date() }
    : { estado_envase: 'abierto' }

  const { count } = await tx.insumo.updateMany({
    where: {
      id: insumo.id,
      tipo_control: 'estado',
      estado_envase: estadoEsperado,
      cantidad: { gt: 0 },
    },
    data,
  })

  if (count === 0) {
    const actual = await tx.insumo.findUnique({ where: { id: insumo.id } })
    if (!actual || actual.cantidad === 0 || actual.estado_envase === 'terminado') {
      throw new HttpError(
        409,
        `"${insumo.descripcion ?? insumo.tipo_insumo}" está terminado: no quedan envases en el inventario`,
      )
    }
    if (actual.estado_envase !== 'abierto') {
      throw new HttpError(409, `El estado del envase de "${insumo.descripcion ?? insumo.tipo_insumo}" cambió; vuelve a cargar el inventario`)
    }
  }
}

async function notificarStockBajo(insumos) {
  for (const insumo of insumos) {
    try {
      await sendLowStockNotification(insumo)
    } catch (error) {
      console.error(`No se pudo enviar el aviso de stock bajo del insumo ${insumo.id}:`, error)
    }
  }
}

export async function createConsumoDiario({ insumos }, rut_usuario) {
  const { consumo, insumosConStockBajo } = await prisma.$transaction(async (tx) => {
    const insumosValidados = await validarInsumos(tx, insumos)
    const registro = await tx.consumo_diario.create({
      data: { rut_usuario },
      select: { id_consumo_diario: true },
    })

    await tx.consumo_diario_insumo.createMany({
      data: insumosValidados.map(({ id_insumo, cantidad }) => ({
        id_consumo_diario: registro.id_consumo_diario,
        id_insumo,
        cantidad,
      })),
    })

    const movimientos = []
    const insumosConStockBajo = []

    for (const { id_insumo, cantidad, insumo } of insumosValidados) {
      if (insumo.tipo_control === 'estado') {
        await registrarUsoDeEnvase(tx, insumo)
        continue
      }

      const { count } = await tx.insumo.updateMany({
        where: {
          id: id_insumo,
          cantidad: { gte: cantidad },
        },
        data: { cantidad: { decrement: cantidad } },
      })

      if (count === 0) {
        const actual = await tx.insumo.findUnique({ where: { id: id_insumo } })
        if (!actual) {
          throw new HttpError(400, `El insumo con id ${id_insumo} no existe en el inventario`)
        }
        throw errorStockInsuficiente(actual, cantidad)
      }

      const actualizado = await tx.insumo.findUnique({ where: { id: id_insumo } })
      if (!actualizado) {
        throw new HttpError(400, `El insumo con id ${id_insumo} no existe en el inventario`)
      }

      movimientos.push({
        id_insumo,
        tipo: 'salida',
        cantidad,
        rut_usuario,
        id_consumo_diario: registro.id_consumo_diario,
        descripcion: `Consumo diario #${registro.id_consumo_diario}`,
      })

      if (!isLowStock(insumo.cantidad) && isLowStock(actualizado.cantidad)) {
        insumosConStockBajo.push(actualizado)
      }
    }

    if (movimientos.length > 0) {
      await tx.movimiento_insumo.createMany({ data: movimientos })
    }

    const consumo = await tx.consumo_diario.findUnique({
      where: { id_consumo_diario: registro.id_consumo_diario },
      include: incluirConsumoDiario,
    })

    if (!consumo) {
      throw new HttpError(500, 'No se pudo recuperar el consumo diario recién registrado')
    }

    return { consumo, insumosConStockBajo }
  })

  await notificarStockBajo(insumosConStockBajo)
  return consumo
}

export async function getConsumosDiarios(limite = 100) {
  return prisma.consumo_diario.findMany({
    orderBy: [{ fecha: 'desc' }, { id_consumo_diario: 'desc' }],
    take: limite,
    include: incluirConsumoDiario,
  })
}
