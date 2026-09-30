import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/validate.middleware.js';

// Registra la adopción de un animal. Todo ocurre dentro de una transacción:
// si falla cualquier paso, no queda nada a medias en la base de datos.
export const registrarAdopcion = (id_animal, datos) => {
  const {
    fecha_adopcion, rut_usuario,
    nombre_adoptante, direccion, telefono, correo, fecha_nacimiento, 
  } = datos;

  return prisma.$transaction(async (tx) => {
    // 1. El animal debe existir
    const animal = await tx.animales.findUnique({
      where: { id_animal },
      include: { adopciones: true },
    });
    if (!animal) throw new HttpError(404, 'Animal no encontrado');

    // 2. Y no puede estar adoptado (la tabla actual no lo impide por sí sola)
    if (animal.adopciones.length > 0) throw new HttpError(409, 'El animal ya fue adoptado');

    // 3. Se crea el adoptante. Si el rut_usuario no existe, Prisma lanza P2003 
    //    y se deshace todo (no se crea la adopción ni el adoptante).
    const adoptante = await tx.adoptante.create({
      data: {
        direccion,
        telefono,
        correo,
        fecha_nacimiento,
        nombre_adoptante,
      },
    });

    // 4. Se crea la adopción que une animal, adoptante y voluntario.
    //    Si el rut_usuario no existe, Prisma lanza P2003 y se deshace todo (también el adoptante).
    return tx.adopciones.create({
      data: {
        fecha_adopcion,
        id_animal,
        id_adoptante: adoptante.id_adoptante,
        id_usuario: rut_usuario,
      },
      include: { adoptante: true },
    });
  });
};
