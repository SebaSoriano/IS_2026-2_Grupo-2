//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import usuarioPublico from './usuario.select.js';


export const  crearTurno = (data) => {
    return prisma.turno.create({ data, 
        include: { usuario: usuarioPublico, horario: true } 
    });
};