import prisma from '../config/prisma.js';

// Datos del usuario
const usuarioPublico = {
  select: { rut_usuario: true, nombre_usuario: true },
};

// Registra una donación recibida desde el formulario
export const createDonacion = (datos) =>
  prisma.donaciones.create({
    data: {
      ...datos,
      fecha_donacion: datos.fecha_donacion ?? new Date(),
    },
    include: { usuario: usuarioPublico },
  });

// Listado de donaciones, de la más reciente a la más antigua
export const getAllDonaciones = () =>
  prisma.donaciones.findMany({
    orderBy: { fecha_donacion: 'desc' },
    include: { usuario: usuarioPublico },
  });

// Una donación por su id
export const getDonacionById = (id_donacion) =>
  prisma.donaciones.findUnique({
    where: { id_donacion },
    include: { usuario: usuarioPublico },
  });