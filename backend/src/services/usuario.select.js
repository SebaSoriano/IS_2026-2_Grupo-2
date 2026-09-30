import prisma from '../config/prisma.js';

const usuarioPublico = {
  select: { rut_usuario: true, correo: true },
};