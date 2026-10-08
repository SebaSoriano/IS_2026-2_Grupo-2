//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';

// api para crear un turno
export const  crearTurno = (data) => {
    return prisma.turno.create({ data, 
        include: { usuario: usuarioPublico, horario: true } 
    });
};

// api para obtener todos los turnos
export const obtenerTurnos = ( ) => {
    return prisma.turno.findMany({
        include: { usuario: usuarioPublico, horario: true },
    });
}
