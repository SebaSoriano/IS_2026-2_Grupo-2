import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { borrarCertificado, guardarCertificado, rutaCertificado } from '../utils/certificados.js';
import { ESTADOS_ABIERTOS, MAXIMO_SOLICITUDES } from '../config/adopciones.js';

// Lo que se trae de cada solicitud para mostrarla en la intranet
const datosSolicitud = {
  animal: {
    select: { id_animal: true, nombre_animal: true, especie_animal: true, foto_animal: true, estado_animal: true },
  },
  adoptante: true,
};

// Busca una solicitud con su animal. Si no existe responde 404.
// tx es la transacción en la que se está trabajando
async function buscarSolicitud(tx, id_solicitud) {
  const solicitud = await tx.solicitudes_adopcion.findUnique({
    where: { id_solicitud },
    include: { animal: { select: { estado_animal: true } } },
  });
  if (!solicitud) throw new HttpError(404, 'Solicitud no encontrada');
  return solicitud;
}

// Cuenta las solicitudes abiertas (pendientes y en proceso) de un animal.
// db puede ser prisma o la transacción (tx): las dos tienen los mismos métodos
function contarSolicitudesAbiertas(db, id_animal) {
  return db.solicitudes_adopcion.count({
    where: { id_animal, estado: { in: ESTADOS_ABIERTOS } },
  });
}

// Si el animal ya tiene el máximo de solicitudes abiertas, no se acepta otra
async function revisarCupo(tx, id_animal) {
  const abiertas = await contarSolicitudesAbiertas(tx, id_animal);
  if (abiertas >= MAXIMO_SOLICITUDES) {
    throw new HttpError(409, `Este animal ya tiene ${MAXIMO_SOLICITUDES} solicitudes en revisión; no recibe más por ahora`);
  }
}

// ---------- Públicas (página principal, sin sesión) ----------

// Datos públicos de un animal para mostrarlo arriba del formulario de adopción.
// Solo se puede pedir un animal que esté disponible.
export const getAnimalParaAdoptar = async (id_animal) => {
  const animal = await prisma.animales.findUnique({
    where: { id_animal },
    select: {
      id_animal: true,
      nombre_animal: true,
      especie_animal: true,
      sexo_animal: true,
      edad: true,
      foto_animal: true,
      estado_animal: true,
    },
  });
  if (!animal || animal.estado_animal !== 'disponible') {
    throw new HttpError(404, 'Este animal no está disponible para adopción');
  }
  // Si ya llegó al máximo de solicitudes, tampoco se muestra el formulario
  if (await contarSolicitudesAbiertas(prisma, id_animal) >= MAXIMO_SOLICITUDES) {
    throw new HttpError(404, 'Este animal ya recibió el máximo de solicitudes. Vuelve a revisar más adelante');
  }
  return animal;
};

// Crea el adoptante y su solicitud por un animal.
// estado: 'pendiente' (desde la página pública) o 'en_proceso' (ingresada a mano en la intranet)
async function crearSolicitud(datos, estado) {
  // Se separa el id del animal; el resto (...datosAdoptante) son las columnas de la tabla adoptante
  const { id_animal, ...datosAdoptante } = datos;

  // Transacción: el adoptante, la solicitud y el estado del animal se guardan juntos, o nada
  return prisma.$transaction(async (tx) => {
    const animal = await tx.animales.findUnique({
      where: { id_animal },
      select: { estado_animal: true },
    });
    if (!animal) throw new HttpError(404, 'Animal no encontrado');
    if (animal.estado_animal !== 'disponible') {
      throw new HttpError(409, 'El animal no está disponible para adopción');
    }
    await revisarCupo(tx, id_animal);

    const adoptante = await tx.adoptante.create({ data: datosAdoptante });

    const solicitud = await tx.solicitudes_adopcion.create({
      data: { estado, id_animal, id_adoptante: adoptante.id_adoptante },
      include: datosSolicitud,
    });

    // Si se ingresó a mano, el animal queda asignado: pasa a "en proceso"
    if (estado === 'en_proceso') {
      await tx.animales.update({
        where: { id_animal },
        data: { estado_animal: 'en_proceso' },
      });
    }

    return solicitud;
  });
}

// Solicitud desde la página pública: además de los datos, trae el PDF del certificado de antecedentes
export async function crearSolicitudPublica(datos, archivo) {
  if (!archivo) throw new HttpError(400, 'Adjunta tu certificado de antecedentes en PDF');

  // 1) Se guarda el PDF en el disco (si no es un PDF de verdad, responde 400)
  const certificado_antecedentes = await guardarCertificado(archivo);

  try {
    // 2) Se crea el adoptante (con el nombre del archivo) y su solicitud
    return await crearSolicitud({ ...datos, certificado_antecedentes }, 'pendiente');
  } catch (error) {
    // Si algo falló (ej: el animal ya no está disponible), se borra el PDF para no dejar basura
    await borrarCertificado(certificado_antecedentes);
    throw error;
  }
}

// ---------- Intranet (piden sesión) ----------

// Ingreso manual: el animal es opcional
export async function crearSolicitudManual(datos) {
  // Sin animal: solo se guarda el adoptante (la solicitud se crea después con "Ingresar Solicitud")
  if (datos.id_animal === undefined) {
    return prisma.adoptante.create({ data: datos });
  }
  // Con animal: adoptante + solicitud "en proceso" + animal "en proceso" (como antes)
  return crearSolicitud(datos, 'en_proceso');
}

// Ruta del PDF del certificado de un adoptante (para que el Admin lo vea)
export async function getCertificado(id_adoptante) {
  const adoptante = await prisma.adoptante.findUnique({
    where: { id_adoptante },
    select: { certificado_antecedentes: true },
  });
  if (!adoptante) throw new HttpError(404, 'Adoptante no encontrado');
  if (!adoptante.certificado_antecedentes) {
    throw new HttpError(404, 'Este adoptante no tiene certificado de antecedentes');
  }
  return rutaCertificado(adoptante.certificado_antecedentes);
}

// Adoptantes registrados (desde la página pública o la intranet), ordenados por nombre
export const getAdoptantes = () =>
  prisma.adoptante.findMany({
    orderBy: { nombre_adoptante: 'asc' },
    select: { id_adoptante: true, nombre_adoptante: true, correo: true },
  });

// Inicia un proceso de adopción con un adoptante que ya existe y un animal disponible.
// La solicitud queda "en proceso" y el animal también.
export const crearSolicitudExistente = ({ id_adoptante, id_animal }) =>
  prisma.$transaction(async (tx) => {
    const adoptante = await tx.adoptante.findUnique({ where: { id_adoptante } });
    if (!adoptante) throw new HttpError(404, 'Adoptante no encontrado');

    const animal = await tx.animales.findUnique({
      where: { id_animal },
      select: { estado_animal: true },
    });
    if (!animal) throw new HttpError(404, 'Animal no encontrado');
    if (animal.estado_animal !== 'disponible') {
      throw new HttpError(409, 'El animal no está disponible para adopción');
    }
    await revisarCupo(tx, id_animal);

    await tx.animales.update({
      where: { id_animal },
      data: { estado_animal: 'en_proceso' },
    });

    return tx.solicitudes_adopcion.create({
      data: { estado: 'en_proceso', id_adoptante, id_animal },
      include: datosSolicitud,
    });
  });

// Solicitudes abiertas (pendientes y en proceso), de la más antigua a la más nueva
export const getSolicitudes = () =>
  prisma.solicitudes_adopcion.findMany({
    where: { estado: { in: ['pendiente', 'en_proceso'] } },
    orderBy: { fecha_solicitud: 'asc' },
    include: datosSolicitud,
  });

// Agenda (o cambia) la hora de visita. La solicitud pasa a "en proceso" y el animal también.
export const agendarVisita = (id_solicitud, fecha_visita) =>
  prisma.$transaction(async (tx) => {
    const solicitud = await buscarSolicitud(tx, id_solicitud);

    if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'en_proceso') {
      throw new HttpError(409, 'La solicitud ya está cerrada');
    }
    // Si la solicitud estaba pendiente, el animal tiene que seguir disponible
    // (si está "en proceso", es porque otra persona ya va más adelante)
    if (solicitud.estado === 'pendiente' && solicitud.animal.estado_animal !== 'disponible') {
      throw new HttpError(409, 'El animal ya no está disponible (está en proceso con otra persona, adoptado o fallecido)');
    }

    await tx.animales.update({
      where: { id_animal: solicitud.id_animal },
      data: { estado_animal: 'en_proceso' },
    });

    return tx.solicitudes_adopcion.update({
      where: { id_solicitud },
      data: { estado: 'en_proceso', fecha_visita },
      include: datosSolicitud,
    });
  });

// Rechaza una solicitud. Si estaba en proceso, el animal vuelve a quedar disponible.
export const rechazarSolicitud = (id_solicitud) =>
  prisma.$transaction(async (tx) => {
    const solicitud = await buscarSolicitud(tx, id_solicitud);

    if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'en_proceso') {
      throw new HttpError(409, 'La solicitud ya está cerrada');
    }

    if (solicitud.estado === 'en_proceso') {
      await tx.animales.update({
        where: { id_animal: solicitud.id_animal },
        data: { estado_animal: 'disponible' },
      });
    }

    return tx.solicitudes_adopcion.update({
      where: { id_solicitud },
      data: { estado: 'rechazada' },
      include: datosSolicitud,
    });
  });

// Marca la adopción como hecha:
// 1. crea la fila en "adopciones" (fecha de hoy y el usuario que inició sesión)
// 2. la solicitud pasa a "adoptada" y el animal a "adoptado"
// 3. las otras solicitudes abiertas por el mismo animal se rechazan
export const marcarAdoptado = (id_solicitud, rut_usuario) =>
  prisma.$transaction(async (tx) => {
    const solicitud = await buscarSolicitud(tx, id_solicitud);

    if (solicitud.estado !== 'en_proceso') {
      throw new HttpError(409, 'Solo se puede marcar como adoptada una solicitud en proceso (primero agenda la visita)');
    }

    const adopcion = await tx.adopciones.create({
      data: {
        fecha_adopcion: new Date(),
        id_animal: solicitud.id_animal,
        id_adoptante: solicitud.id_adoptante,
        id_usuario: rut_usuario,
      },
      include: { animal: true, adoptante: true },
    });

    await tx.solicitudes_adopcion.update({
      where: { id_solicitud },
      data: { estado: 'adoptada' },
    });

    await tx.animales.update({
      where: { id_animal: solicitud.id_animal },
      data: { estado_animal: 'adoptado' },
    });

    await tx.solicitudes_adopcion.updateMany({
      where: {
        id_animal: solicitud.id_animal,
        id_solicitud: { not: id_solicitud },
        estado: { in: ['pendiente', 'en_proceso'] },
      },
      data: { estado: 'rechazada' },
    });

    return adopcion;
  });

// Listado de adopciones, de la más reciente a la más antigua
export const getAllAdopciones = () =>
  prisma.adopciones.findMany({
    orderBy: { fecha_adopcion: 'desc' },
    include: {
      animal: true,
      adoptante: true,
      usuario: { select: { rut_usuario: true, nombre_usuario: true } },
    },
  });