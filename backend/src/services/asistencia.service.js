//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { conEstado } from './turno.service.js';
import { ahoraEnChile } from '../utils/fechas.js';

// service para obtener la asistencia de un mes ("AAAA-MM")
// devuelve todos los usuarios con sus turnos de ese mes; cada turno trae su hora_llegada
// y su estado ('a-tiempo', 'tarde', 'ausente' o 'pendiente', ver estadoAsistencia en turno.service.js)
export const obtenerAsistenciasDelMes = async (mes) => {
    const [anio, numeroMes] = mes.split('-').map(Number);
    const inicio = new Date(Date.UTC(anio, numeroMes - 1, 1));
    const finExclusivo = new Date(Date.UTC(anio, numeroMes, 1));

    const usuarios = await prisma.usuario.findMany({
        orderBy: { nombre_usuario: 'asc' },
        select: {
            rut_usuario: true,
            nombre_usuario: true,
            turnos: {
                where: { fecha: { gte: inicio, lt: finExclusivo } },
                select: { id: true, fecha: true, hora_inicio: true, hora_fin: true, hora_llegada: true },
                orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
            },
        },
    });

    // la misma hora para todos los turnos, asi el estado es consistente en toda la tabla
    const ahora = ahoraEnChile();
    return usuarios.map((usuario) => ({
        ...usuario,
        turnos: usuario.turnos.map((turno) => conEstado(turno, ahora)),
    }));
};
