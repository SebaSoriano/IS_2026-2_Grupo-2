//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';

// service para obtener el horario semanal: los 7 dias (1 = Lunes ... 7 = Domingo)
// cada uno con sus turnos ordenados por hora de llegada y el usuario que lo tiene
export const obtenerHorarios = () => {
    return prisma.horario.findMany({
        orderBy: { id: 'asc' },
        include: {
            turnos: {
                orderBy: { hora_inicio: 'asc' },
                include: { usuario: usuarioPublico },
            },
        },
    });
};
