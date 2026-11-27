import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';

// Lista todos los procedimientos del catálogo ordenados alfabéticamente.
export const getProcedimientos = () =>
  prisma.procedimiento.findMany({ orderBy: { nombre: 'asc' } });

// Crea un procedimiento nuevo en el catálogo.
// deja guardar "Vacuna antirrábica" y "vacuna antirrábica" como si fueran distintos,
// por eso antes de crear se busca uno con el mismo nombre sin importar mayúsculas
export const createProcedimiento = async ({ nombre }) => {
  const existente = await prisma.procedimiento.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  });
  if (existente) {
    throw new HttpError(409, `Ya existe el procedimiento "${existente.nombre}"`);
  }
  return prisma.procedimiento.create({ data: { nombre } });
};

// Los registros médicos guardan el tratamiento como texto (historial_medico.tratamiento),
// así que borrar un procedimiento no cambia ni borra ningún registro: solo deja de sugerirse.
export const deleteProcedimiento = (id) =>
  prisma.procedimiento.delete({ where: { id_procedimiento: id } });