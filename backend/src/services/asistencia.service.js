//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';

// dia de la semana de una fecha igual que el id del horario (1 = Lunes ... 7 = Domingo)
// getUTCDay devuelve 0 para el domingo, por eso se cambia a 7
const diaDelHorario = (fecha) => fecha.getUTCDay() || 7;

// fecha de hoy sin hora, para no permitir marcar asistencia en dias que aun no pasan
const hoy = () => {
    const ahora = new Date();
    return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
};

// service para obtener la asistencia de un mes ("AAAA-MM")
// devuelve todos los usuarios con los dias de la semana en que tienen turno
// y las asistencias que tienen marcadas dentro de ese mes
export const obtenerAsistenciasDelMes = async (mes) => {
    const [anio, numeroMes] = mes.split('-').map(Number);
    const inicio = new Date(Date.UTC(anio, numeroMes - 1, 1));
    const finExclusivo = new Date(Date.UTC(anio, numeroMes, 1));

    const usuarios = await prisma.usuario.findMany({
        orderBy: { nombre_usuario: 'asc' },
        select: {
            rut_usuario: true,
            nombre_usuario: true,
            turnos: { select: { horario_id: true } },
            asistencias: {
                where: { fecha: { gte: inicio, lt: finExclusivo } },
                select: { id: true, fecha: true },
                orderBy: { fecha: 'asc' },
            },
        },
    });

    // un usuario puede tener varios turnos el mismo dia, por eso se dejan los dias sin repetir
    return usuarios.map(({ turnos, ...usuario }) => ({
        ...usuario,
        dias_turno: [...new Set(turnos.map((turno) => turno.horario_id))].sort((a, b) => a - b),
    }));
};

// service para marcar que un usuario llego a la hora un dia
// solo se puede marcar en dias que ya pasaron y en que el usuario tiene turno segun el horario
// si ya estaba marcada Prisma lanza P2002 (409) y si el usuario no existe P2003 (400)
export const crearAsistencia = async ({ rut_usuario, fecha }) => {
    if (fecha > hoy()) throw new HttpError(400, 'No se puede marcar asistencia en un día que aún no pasa');

    const turno = await prisma.turno.findFirst({
        where: { rut_usuario, horario_id: diaDelHorario(fecha) },
    });
    if (!turno) throw new HttpError(400, 'El usuario no tiene turno ese día de la semana');

    return prisma.asistencia.create({ data: { rut_usuario, fecha } });
};

// service para desmarcar una asistencia, si no existe Prisma lanza P2025 (404)
export const eliminarAsistencia = (id) => {
    return prisma.asistencia.delete({ where: { id } });
};
