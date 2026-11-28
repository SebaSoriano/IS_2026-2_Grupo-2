import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import fs from 'fs/promises';
import path from 'path';
import { CARPETA_FOTOS_ANIMALES } from '../config/uploads.js';
import { ESTADOS_ABIERTOS, MAXIMO_SOLICITUDES } from '../config/adopciones.js';
import { historialParaSalud, resumenVacunas } from './saludPublica.service.js';


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
  // 1) Se busca el estado ACTUAL del animal en la base de datos
  const animal = await prisma.animales.findUnique({
    where: { id_animal: id },
    select: { estado_animal: true },
  });
  if (animal === null) throw new HttpError(404, 'Animal no encontrado');

  // 2) Reglas según el estado actual
  if (animal.estado_animal === 'adoptado') {
    // Un animal adoptado solo acepta UN cambio: volver a "disponible" (lo devolvieron al hogar)
    const campos = Object.keys(datos);
    const esDevolucion = campos.length === 1 && datos.estado_animal === 'disponible';
    if (!esDevolucion) {
      throw new HttpError(409, 'Un animal adoptado no se puede modificar; solo se puede marcar como disponible si fue devuelto');
    }
  } else if (animal.estado_animal === 'en_proceso' && datos.estado_animal !== undefined) {
    throw new HttpError(409, 'El estado de un animal en proceso de adopción se cambia desde la sección Adopción');
  }

  // 3) Se guarda el cambio
  return prisma.$transaction(async (tx) => {
    const animalModificado = await tx.animales.update({ where: { id_animal: id }, data: datos });
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
      estado_animal: true,
      _count: { select: { fotos: true } },
    },
  });

  // Si algo está mal, se borran los archivos que multer alcanzó a guardar en el disco
  if (animal === null) {
    for (const archivo of archivos) await borrarArchivoFoto(archivo.filename);
    throw new HttpError(404, 'Animal no encontrado');
  }
  if (animal.estado_animal === 'adoptado') {
    for (const archivo of archivos) await borrarArchivoFoto(archivo.filename);
    throw new HttpError(409, 'No se pueden agregar fotos a un animal adoptado');
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
    include: { animal: { select: { foto_animal: true, estado_animal: true } } },
  });

  // La foto debe existir y pertenecer a ese animal
  if (foto === null || foto.id_animal !== id) {
    throw new HttpError(404, 'Foto no encontrada');
  }
  if (foto.animal.estado_animal === 'adoptado') {
    throw new HttpError(409, 'No se pueden eliminar fotos de un animal adoptado');
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

  // Se borra del disco el archivo de la foto eliminada
  await borrarArchivoFoto(foto.ruta);
  return buscarAnimalConFotos(id);
}

export async function getAnimalesPublicos() {
  const animales = await prisma.animales.findMany({
    // Solo los animales disponibles
    where: {
      estado_animal: 'disponible',
    },
    // Devolvemos solo la información necesaria para las tarjetas públicas.
    select: {
      id_animal: true,
      nombre_animal: true,
      especie_animal: true,
      sexo_animal: true,
      edad: true,
      peso_animal: true,
      foto_animal: true,
      // Galería para el carrusel: solo la ruta de cada foto, en el orden en que se subieron
      fotos: {
        select: { id_foto: true, ruta: true },
        orderBy: { id_foto: 'asc' },
      },
      // Qué se le hizo y cuándo (sin veterinario ni observaciones), para calcular el estado de sus vacunas
      historial: historialParaSalud,
      // Cuántas solicitudes abiertas tiene cada animal (para el límite de 3)
      _count: {
        select: {
          solicitudes: { where: { estado: { in: ESTADOS_ABIERTOS } } },
        },
      },
    },
    // Muestra primero las mascotas registradas más recientemente.
    orderBy: { id_animal: 'desc' },
  });

  // Se quitan los que ya llegaron al máximo de solicitudes.
  // Se calcula cada vez que se pide la lista, por eso la tarjeta cambia apenas se registra una vacuna.
  return animales
    .filter((animal) => animal._count.solicitudes < MAXIMO_SOLICITUDES)
    .map(({ _count, historial, ...animal }) => ({
      ...animal,
      vacunas: resumenVacunas(animal.especie_animal, historial)
        .filter((vacuna) => vacuna.obligatoria)
        .map(({ nombre, estado }) => ({ nombre, estado })),
    }));
}