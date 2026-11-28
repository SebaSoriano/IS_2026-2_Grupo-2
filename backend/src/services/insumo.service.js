// services/insumo.service.js

//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';

// estandarizacion de lo que se mostrar publicamente del usuario, esto para evitar volver a escribir las mismas lineas de codigo
// nunca incluir la contrasena
const usuarioPublico = {
  select: { rut_usuario: true, nombre_usuario: true, correo: true },
};

//obtener todos los insumos incluyendo el usuario que registro el insumo
export async function getAllInsumos() {
  return prisma.insumo.findMany({
    include: {
      usuario: usuarioPublico,
    },
  });
}

export async function getInsumosVencenEntre(fechaInicio, fechaFin) {
  return prisma.insumo.findMany({
    where: {
      fecha_vencimiento: {
        gte: fechaInicio,
        lt: fechaFin,
      },
    },
    orderBy: { fecha_vencimiento: 'asc' },
  });
}

//obtener insumo por id con la informacion del usuario que lo registro
export async function getInsumoById(id) {
  return prisma.insumo.findUnique({
    where: {id},
    include:{
      usuario: usuarioPublico,
     },
  });
}

// Un insumo de tipo "estado" empieza con su envase cerrado (o terminado, si se registra con 0 envases).
// Los de tipo "contable" no usan estado_envase, así que queda en null.
export async function createInsumo(data) {
  if (data.tipo_control === 'estado') {
    data.estado_envase = data.cantidad > 0 ? 'cerrado' : 'terminado';
  }
  return prisma.insumo.create({
    data,
    include: { usuario: usuarioPublico },
  });
}

// Al modificar un insumo de tipo "estado" desde Inventario, se mantiene su estado al día con la cantidad:
// - si se deja en 0 envases, queda "terminado" (no hay nada que usar);
// - si estaba "terminado" y se reponen envases (por ejemplo llegaron 4 frascos), vuelve a "cerrado".
// En los demás casos el estado no cambia: un frasco abierto sigue abierto aunque lleguen más.
export async function updateInsumo(id, data) {
  if (data.cantidad !== undefined) {
    const anterior = await prisma.insumo.findUnique({ where: { id } });
    if (anterior?.tipo_control === 'estado') {
      if (data.cantidad === 0) {
        data.estado_envase = 'terminado';
        data.fecha_apertura = null;
      } else if (anterior.estado_envase === 'terminado') {
        data.estado_envase = 'cerrado';
      }
    }
  }
  return prisma.insumo.update({
    where: { id },
    data,
    include: { usuario: usuarioPublico },
  });
}

// Botón "Se terminó" de Inventario
export async function terminarEnvase(id, rut_usuario) {
  return prisma.$transaction(async (tx) => {
    const insumo = await tx.insumo.findUnique({ where: { id } });
    if (!insumo) throw new HttpError(404, 'Insumo no encontrado');
    if (insumo.tipo_control !== 'estado') {
      throw new HttpError(400, 'Este insumo se controla por cantidad: su stock se descuenta en cada procedimiento');
    }
    if (insumo.estado_envase === 'terminado' || insumo.cantidad === 0) {
      throw new HttpError(409, 'Este insumo ya no tiene envases en el inventario');
    }

    const quedan = insumo.cantidad - 1;
    const actualizado = await tx.insumo.update({
      where: { id },
      data: {
        cantidad: quedan,
        estado_envase: quedan > 0 ? 'cerrado' : 'terminado',
        fecha_apertura: null,
      },
      include: { usuario: usuarioPublico },
    });

    await tx.movimiento_insumo.create({
      data: {
        id_insumo: id,
        tipo: 'salida',
        cantidad: 1,
        rut_usuario,
        descripcion: insumo.estado_envase === 'abierto'
          ? 'Envase terminado (se había registrado su uso)'
          : 'Envase terminado (sin uso registrado)',
      },
    });

    return actualizado;
  });
}

export async function deleteInsumo(id) {
  return prisma.insumo.delete({ where: { id } });
}

export async function getMovimientos(limite = 100) {
  return prisma.movimiento_insumo.findMany({
    orderBy: [{ fecha: 'desc' }, { id_movimiento: 'desc' }],
    take: limite,
    include: {
      insumo: { select: { id: true, tipo_insumo: true, descripcion: true, unidad_medida: true } },
      usuario: { select: { rut_usuario: true, nombre_usuario: true } },
    },
  });
}