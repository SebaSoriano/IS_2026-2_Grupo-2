import prisma from '../config/prisma.js';

export const usuarioPublico = {
  select: { rut_usuario: true, correo: true },
};