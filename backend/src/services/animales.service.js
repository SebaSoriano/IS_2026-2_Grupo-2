import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import fs from 'fs/promises';
import path from 'path';
import { CARPETA_FOTOS_ANIMALES } from '../config/uploads.js';


// Lista de animales (con filtros opcionales)
export async function getAllAnimales(filtros) {
  // Si no llegaron filtros, usamos un objeto vacío
  if (filtros === undefined) {
    filtros = {};
  }
  // "where" son las condiciones de búsqueda. Parte vacío = sin condiciones.
  const where = {};

  // Filtro por nombre (contiene el texto, sin importar mayúsculas)
  if (filtros.nombre !== undefined) {
    where.nombre_animal = {
      contains: filtros.nombre,
      mode: 'insensitive',
    };
  }

  // Filtro por vía de ingreso (igual al texto, sin importar mayúsculas)
  if (filtros.via_ingreso !== undefined) {
    where.via_ingreso = {
      equals: filtros.via_ingreso,
      mode: 'insensitive',
    };
  }

  // Filtro por especie
  if (filtros.especie !== undefined) {
    where.especie_animal = {
      contains: filtros.especie,
      mode: 'insensitive',
    };
  }

  // Filtro por estado (disponible, en_proceso, adoptado o fallecido)
  if (filtros.estado !== undefined) {
    where.estado_animal = filtros.estado;
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
      // fotos para el carrusel, en el orden en que se subieron
      fotos: {
        select: { id_foto: true, ruta: true },
        orderBy: { id_foto: 'asc' },
      },
    },
  });

  return animales;
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

  // Si no existe, devuelve null y el controller responde 404
  return animal;
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
  // Si viene un estado nuevo, se revisa el estado actual del animal
  if (datos.estado_animal !== undefined) {
    const animal = await prisma.animales.findUnique({
      where: { id_animal: id },
      select: { estado_animal: true },
    });

    if (animal === null) {
      throw new HttpError(404, 'Animal no encontrado');
    }

    // Un animal en proceso de adopción o adoptado no se cambia desde aquí
    if (animal.estado_animal === 'en_proceso' || animal.estado_animal === 'adoptado') {
      throw new HttpError(409, 'El estado de un animal en proceso de adopción o adoptado se cambia desde la sección Adopción');
    }
  }

  // Transacción: se modifica el animal y, si falleció, se rechazan sus solicitudes pendientes
  return prisma.$transaction(async (tx) => {
    // Si el id no existe, Prisma lanza un error (P2025) y error.middleware.js responde 404
    const animalModificado = await tx.animales.update({
      where: { id_animal: id },
      data: datos,
    });

    if (datos.estado_animal === 'fallecido') {
      await tx.solicitudes_adopcion.updateMany({
        where: { id_animal: id, estado: 'pendiente' },
        data: { estado: 'rechazada' },
      });
    }

    return animalModificado;
  });
}

//------------------------------------------------------------

// Borra del disco el archivo de una foto (si existe)
async function borrarArchivoFoto(rutaFoto) {
  if (!rutaFoto) {
    return;
  }
  // De "/uploads/animales/animal-5-...jpg" se toma solo "animal-5-...jpg"
  const nombreArchivo = path.basename(rutaFoto);
  try {
    await fs.unlink(path.join(CARPETA_FOTOS_ANIMALES, nombreArchivo));
  } catch {
    // Si el archivo ya no existe, no pasa nada
  }
}

// Máximo de fotos que puede tener un animal
const MAXIMO_FOTOS = 5;

// Devuelve el animal con sus fotos (lo que necesita el frontend para actualizar la tabla y el carrusel)
function buscarAnimalConFotos(id) {
  return prisma.animales.findUnique({
    where: { id_animal: id },
    include: {
      fotos: {
        select: { id_foto: true, ruta: true },
        orderBy: { id_foto: 'asc' },
      },
    },
  });
}

// Agrega una o varias fotos a un animal.
// Si el animal no tenía portada (foto_animal), la primera foto nueva pasa a ser la portada.
export async function agregarFotosAnimal(id, archivos) {
  const animal = await prisma.animales.findUnique({
    where: { id_animal: id },
    select: {
      foto_animal: true,
      _count: { select: { fotos: true } },
    },
  });

  // Si algo está mal, se borran los archivos que multer alcanzó a guardar en el disco
  if (animal === null) {
    for (const archivo of archivos) await borrarArchivoFoto(archivo.filename);
    throw new HttpError(404, 'Animal no encontrado');
  }
  if (animal._count.fotos + archivos.length > MAXIMO_FOTOS) {
    for (const archivo of archivos) await borrarArchivoFoto(archivo.filename);
    throw new HttpError(400, `Un animal puede tener como máximo ${MAXIMO_FOTOS} fotos (ya tiene ${animal._count.fotos})`);
  }

  // Ruta pública de cada archivo, ej: /uploads/animales/animal-5-1730600000000-a1b2c3d4.jpg
  const rutas = archivos.map((archivo) => `/uploads/animales/${archivo.filename}`);

  // Transacción: se guardan las fotos y la portada juntas, o ninguna
  await prisma.$transaction(async (tx) => {
    await tx.fotos_animal.createMany({
      data: rutas.map((ruta) => ({ ruta, id_animal: id })),
    });
    if (!animal.foto_animal) {
      await tx.animales.update({
        where: { id_animal: id },
        data: { foto_animal: rutas[0] },
      });
    }
  });

  return buscarAnimalConFotos(id);
}

// Elimina una foto de un animal.
// Si era la portada, la portada pasa a ser la siguiente foto (o queda vacía si no quedan).
export async function eliminarFotoAnimal(id, idFoto) {
  const foto = await prisma.fotos_animal.findUnique({
    where: { id_foto: idFoto },
    include: { animal: { select: { foto_animal: true } } },
  });

  // La foto debe existir y pertenecer a ese animal
  if (foto === null || foto.id_animal !== id) {
    throw new HttpError(404, 'Foto no encontrada');
  }

  await prisma.$transaction(async (tx) => {
    await tx.fotos_animal.delete({ where: { id_foto: idFoto } });

    if (foto.animal.foto_animal === foto.ruta) {
      const siguiente = await tx.fotos_animal.findFirst({
        where: { id_animal: id },
        orderBy: { id_foto: 'asc' },
      });
      await tx.animales.update({
        where: { id_animal: id },
        data: { foto_animal: siguiente ? siguiente.ruta : null },
      });
    }
  });

  // Borrar del disco la foto anterior si tenía alguna
  await borrarArchivoFoto(animal.foto_animal);
  return buscarAnimalConFotos(id);
}

export async function getAnimalesPublicos() {
  return prisma.animales.findMany({
    // Una mascota está disponible si no tiene registros relacionados en "adopciones".
    where: {
      estado_animal: 'disponible',
    },
    // Devolvemos solo la información necesaria para las tarjetas públicas.
    select: {
      id_animal: true,
      nombre_animal: true,
      especie_animal: true,
      edad: true,
      peso_animal: true,
      foto_animal: true,
    },
    // Muestra primero las mascotas registradas más recientemente.
    orderBy: { id_animal: 'desc' },
  });
}