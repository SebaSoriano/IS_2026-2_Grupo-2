import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';

// Datos públicos del voluntario (nunca la contraseña)
const usuarioPublico = { select: { rut_usuario: true, nombre_usuario: true } };

// La tabla "animales" no tiene una columna de estado: un animal está adoptado
// si tiene una fila en "adopciones". Esta función agrega ese dato a la respuesta.
const marcarAdopcion = ({ adopciones, ...animal }) => ({
  ...animal,
  adoptado: adopciones.length > 0,
  adopcion: adopciones[0] ?? null,
});

// Listado de todos los animales (disponibles y adoptados), con filtros opcionales
export const getAllAnimales = async (filtros = {}) => {
  const where = {};
  if (filtros.especie) {
    where.especie_animal = { contains: filtros.especie, mode: 'insensitive' };
  }
  if (filtros.adoptado !== undefined) {
    // some: tiene al menos una adopción / none: no tiene ninguna
    where.adopciones = filtros.adoptado ? { some: {} } : { none: {} };
  }

  const animales = await prisma.animales.findMany({
    where,
    orderBy: { id_animal: 'desc' },
    include: { adopciones: { select: { fecha_adopcion: true } } },
  });
  return animales.map(marcarAdopcion);
};

// Detalle de un animal: su adopción (con el adoptante) y su historial médico
export const getAnimalById = async (id) => {
  const animal = await prisma.animales.findUnique({
    where: { id_animal: id },
    include: {
      adopciones: { include: { adoptante: true, usuario: usuarioPublico } },
      historial: { orderBy: { fecha_tratamiento: 'desc' } },
    },
  });
  return animal ? marcarAdopcion(animal) : null;
};

export const createAnimal = (datos) => prisma.animales.create({ data: datos });

// Si el id no existe, Prisma lanza P2025 y error.middleware.js responde 404
export const updateAnimal = (id, datos) =>
  prisma.animales.update({ where: { id_animal: id }, data: datos });

// Solo se puede eliminar un animal sin adopciones ni historial médico,
// para no perder el registro de lo que pasó con él.
export const deleteAnimal = async (id) => {
  const animal = await prisma.animales.findUnique({
    where: { id_animal: id },
    include: { _count: { select: { adopciones: true, historial: true } } },
  });
  if (!animal) throw new HttpError(404, 'Animal no encontrado');
  if (animal._count.adopciones > 0 || animal._count.historial > 0) {
    throw new HttpError(409, 'No se puede eliminar un animal con adopciones o historial médico');
  }
  return prisma.animales.delete({ where: { id_animal: id } });
};
