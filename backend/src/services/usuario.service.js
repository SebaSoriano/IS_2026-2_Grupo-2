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

// service para listar todos los usuarios, ordenados por nombre para mostrarlos en el selector de turnos
export const listarUsuarios = () => {
    return prisma.usuario.findMany({
        select: usuarioPublico.select,
        orderBy: { nombre_usuario: 'asc' },
    });
};
