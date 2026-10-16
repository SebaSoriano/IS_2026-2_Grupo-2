//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';
import { obtenerUsuarioPorRut } from './usuario.service.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { diaDelHorario, hoy } from '../utils/fechas.js';

const incluirTurno = { usuario: usuarioPublico, horario: true };
// ordena por fecha y luego por hora de llegada
const ordenTurnos = [{ fecha: 'asc' }, { hora_inicio: 'asc' }];

// convierte "08:00" en 8 para poder comparar las horas
const hora = (texto) => Number(texto.slice(0, 2));

// los turnos de dias que ya pasaron son historial: no se pueden crear, editar ni borrar
const verificarQueNoEsPasado = (fecha, mensaje) => {
    if (fecha < hoy()) throw new HttpError(400, mensaje);
};

// un usuario puede tener varios turnos la misma fecha, pero no pueden cruzarse
// si no hay hora_fin, el turno dura solo su bloque de una hora
const verificarTraslape = async ({ rut_usuario, fecha, hora_inicio, hora_fin }, idExcluir) => {
    const turnosDelDia = await prisma.turno.findMany({
        where: { rut_usuario, fecha, NOT: { id: idExcluir } },
    });
    const inicio = hora(hora_inicio);
    const fin = hora_fin ? hora(hora_fin) : inicio + 1;

    const seCruza = turnosDelDia.some((turno) => {
        const otroInicio = hora(turno.hora_inicio);
        const otroFin = turno.hora_fin ? hora(turno.hora_fin) : otroInicio + 1;
        return inicio < otroFin && otroInicio < fin;
    });
    if (seCruza) throw new HttpError(409, 'El usuario ya tiene un turno que se cruza con ese horario ese día');
};

// busca un turno por id o responde 404
const obtenerTurnoPorId = async (id) => {
    const turno = await prisma.turno.findUnique({ where: { id } });
    if (!turno) throw new HttpError(404, 'Turno no encontrado');
    return turno;
};

// service para crear un turno en una fecha de hoy en adelante
// el dia de la semana (horario_id) sale de la fecha
// si el usuario no existe Prisma lanza P2003 (400) que responde error.middleware.js
export const crearTurno = async (data) => {
    verificarQueNoEsPasado(data.fecha, 'No se pueden añadir turnos en días que ya pasaron');
    await verificarTraslape(data);
    return prisma.turno.create({
        data: { ...data, horario_id: diaDelHorario(data.fecha) },
        include: incluirTurno,
    });
};

// service para obtener todos los turnos
export const obtenerTurnos = ( ) => {
    return prisma.turno.findMany({
        include: incluirTurno,
        orderBy: ordenTurnos,
    });
}

// service para obtener los turnos de un usuario por rut
// si el usuario no existe se lanza un 404 que responde error.middleware.js
export const obtenerTurnosPorRut = async (rut) => {
    const usuario = await obtenerUsuarioPorRut(rut);
    if (!usuario) throw new HttpError(404, 'Usuario no encontrado');

    return prisma.turno.findMany({
        where: { rut_usuario: rut },
        include: incluirTurno,
        orderBy: ordenTurnos,
    });
};

// service para editar un turno que aun no pasa, y sin moverlo a una fecha que ya paso
// se junta lo que llega con lo que ya tenia el turno para revisar las horas completas
export const actualizarTurno = async (id, data) => {
    const turno = await obtenerTurnoPorId(id);
    verificarQueNoEsPasado(turno.fecha, 'No se puede editar un turno de un día que ya pasó');

    const turnoEditado = { ...turno, ...data };
    verificarQueNoEsPasado(turnoEditado.fecha, 'No se puede mover un turno a un día que ya pasó');
    if (turnoEditado.hora_fin && turnoEditado.hora_fin <= turnoEditado.hora_inicio) {
        throw new HttpError(400, 'La hora de ida debe ser después de la hora de llegada');
    }
    await verificarTraslape(turnoEditado, id);

    // si cambia la fecha, tambien cambia el dia de la semana
    const cambios = data.fecha ? { ...data, horario_id: diaDelHorario(data.fecha) } : data;
    return prisma.turno.update({ where: { id }, data: cambios, include: incluirTurno });
};

// service para borrar un turno que aun no pasa
export const eliminarTurno = async (id) => {
    const turno = await obtenerTurnoPorId(id);
    verificarQueNoEsPasado(turno.fecha, 'No se puede borrar un turno de un día que ya pasó');
    return prisma.turno.delete({ where: { id } });
};

// service para marcar o desmarcar que el usuario llego a la hora a su turno
// solo se puede en turnos de hoy o de dias que ya pasaron
export const marcarAsistenciaTurno = async (id, { llego_a_la_hora }) => {
    const turno = await obtenerTurnoPorId(id);
    if (turno.fecha > hoy()) throw new HttpError(400, 'No se puede marcar asistencia en un turno que aún no llega');

    return prisma.turno.update({ where: { id }, data: { llego_a_la_hora }, include: incluirTurno });
};
