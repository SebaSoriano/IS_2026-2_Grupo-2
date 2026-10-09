//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';

// service para obtener un usuario por rut, sin la contrasena
export const obtenerUsuarioPorRut = (rut) => {
    return prisma.usuario.findUnique({
        where: { rut_usuario: rut },
        select: usuarioPublico.select,
    });
};

// service para buscar usuarios cuyo nombre contenga el texto escrito
// mode 'insensitive' hace que no importen las mayusculas ("luk" encuentra a "Lukas")
export const buscarUsuariosPorNombre = (nombre) => {
    return prisma.usuario.findMany({
        where: { nombre_usuario: { contains: nombre, mode: 'insensitive' } },
        select: usuarioPublico.select,
        orderBy: { nombre_usuario: 'asc' },
        take: 10,
    });
};
