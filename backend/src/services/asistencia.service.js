//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';

// service para obtener la asistencia de un mes ("AAAA-MM")
// devuelve todos los usuarios con sus turnos de ese mes; cada turno trae si llego a la hora
// la asistencia se marca en el turno (ver marcarAsistenciaTurno en turno.service.js)
export const obtenerAsistenciasDelMes = (mes) => {
    const [anio, numeroMes] = mes.split('-').map(Number);
    const inicio = new Date(Date.UTC(anio, numeroMes - 1, 1));
    const finExclusivo = new Date(Date.UTC(anio, numeroMes, 1));

    return prisma.usuario.findMany({
        orderBy: { nombre_usuario: 'asc' },
        select: {
            rut_usuario: true,
            nombre_usuario: true,
            turnos: {
                where: { fecha: { gte: inicio, lt: finExclusivo } },
                select: { id: true, fecha: true, hora_inicio: true, hora_fin: true, llego_a_la_hora: true },
                orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
            },
        },
    });
};
