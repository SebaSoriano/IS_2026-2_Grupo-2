//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';
import { obtenerUsuarioPorRut } from './usuario.service.js';
import { HttpError } from '../middlewares/error.middleware.js';

// service para crear un turno
export const  crearTurno = (data) => {
    return prisma.turno.create({ data,
        include: { usuario: usuarioPublico, horario: true }
    });
};

// service para obtener todos los turnos
export const obtenerTurnos = ( ) => {
    return prisma.turno.findMany({
        include: { usuario: usuarioPublico, horario: true },
    });
}

// service para obtener los turnos de un usuario por rut
// si el usuario no existe se lanza un 404 que responde error.middleware.js
export const obtenerTurnosPorRut = async (rut) => {
    const usuario = await obtenerUsuarioPorRut(rut);
    if (!usuario) throw new HttpError(404, 'Usuario no encontrado');

    return prisma.turno.findMany({
        where: { rut_usuario: rut },
        include: { usuario: usuarioPublico, horario: true }
    });
};
