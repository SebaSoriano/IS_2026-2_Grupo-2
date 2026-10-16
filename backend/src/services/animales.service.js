import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';


// Agrega "adoptado" y "adopcion" a un animal
function marcarAdopcion(animal) {
  // ¿El animal tiene al menos una adopción guardada?
  if (animal.adopciones.length > 0) {
    animal.adoptado = true;
    animal.adopcion = animal.adopciones[0];
  } else {
    animal.adoptado = false;
    animal.adopcion = null;
  }

  delete animal.adopciones;
  return animal;
}


// Lista de animales (con filtros opcionales)
export async function getAllAnimales(filtros) {
  // Si no llegaron filtros, usamos un objeto vacío
  if (filtros === undefined) {
    filtros = {};
  }
  // "where" son las condiciones de búsqueda. Parte vacío = sin condiciones.
  const where = {};

  // Filtro por especie
  if (filtros.especie !== undefined) {
    where.especie_animal = {
      contains: filtros.especie,
      mode: 'insensitive',
    };
  }

  // Filtro por adoptado / no adoptado
  if (filtros.adoptado === true) {
    where.adopciones = { some: {} };
  }
  if (filtros.adoptado === false) {
    where.adopciones = { none: {} };
  }

  // Filtro por edad
  if (filtros.edad_min !== undefined || filtros.edad_max !== undefined) {
    where.edad = {};
    if (filtros.edad_min !== undefined) {
      where.edad.gte = filtros.edad_min;
    }
    if (filtros.edad_max !== undefined) {
      where.edad.lte = filtros.edad_max;
    }
  }

  // Aplicamos el filtro con la constante "where"
  const animales = await prisma.animales.findMany({
    where: where,
    orderBy: { id_animal: 'desc' },
    include: {
      adopciones: {
        select: { fecha_adopcion: true },
      },
    },
  });

  // Recorremos la lista y marcamos cada animal como adoptado o no
  const resultado = [];
  for (const animal of animales) {
    resultado.push(marcarAdopcion(animal));
  }

  return resultado;
}

//------------------------------------------------------------

// Buscar un animal por su id

export async function getAnimalById(id) {
  const animal = await prisma.animales.findUnique({
    where: { id_animal: id },
    include: {
      adopciones: {
        include: {
          adoptante: true,
          usuario: {
            select: { rut_usuario: true, nombre_usuario: true },
          },
        },
      },
      historial: {
        orderBy: { fecha_tratamiento: 'desc' },
      },
    },
  });

  // Si no existe, devolvemos null y el controller responde 404
  if (animal === null) {
    return null;
  }

  return marcarAdopcion(animal);
}

//------------------------------------------------------------

// Crear un animal

export async function createAnimal(datos) {
  const animalNuevo = await prisma.animales.create({
    data: datos,
  });

  return animalNuevo;
}

//------------------------------------------------------------

// 4. Modificar un animal

export async function updateAnimal(id, datos) {
  // Si el id no existe, Prisma lanza un error (P2025)
  // y error.middleware.js lo convierte en una respuesta 404.
  const animalModificado = await prisma.animales.update({
    where: { id_animal: id },
    data: datos,
  });

  return animalModificado;
}

// ------------------------------------------------------------

// 5. Eliminar un animal

export async function deleteAnimal(id) {
  // Busca al animal y cuenta sus adopciones e historial
  const animal = await prisma.animales.findUnique({
    where: { id_animal: id },
    include: {
      _count: {
        select: { adopciones: true, historial: true },
      },
    },
  });

  // Si no existe, error 404
  if (animal === null) {
    throw new HttpError(404, 'Animal no encontrado');
  }

  // Si tiene adopciones o historial, no se puede borrar
  const cantidadAdopciones = animal._count.adopciones;
  const cantidadHistorial = animal._count.historial;

  if (cantidadAdopciones > 0 || cantidadHistorial > 0) {
    throw new HttpError(409, 'No se puede eliminar un animal con adopciones o historial médico');
  }

  // Si pasó todas las revisiones, se elimina
  const animalEliminado = await prisma.animales.delete({
    where: { id_animal: id },
  });

  return animalEliminado;
}