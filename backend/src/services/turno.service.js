//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';
import { obtenerUsuarioPorRut } from './usuario.service.js';
import { HttpError } from '../middlewares/error.middleware.js';

const incluirTurno = { usuario: usuarioPublico, horario: true };
// ordena por dia y luego por hora de llegada
const ordenTurnos = [{ horario_id: 'asc' }, { hora_inicio: 'asc' }];

// convierte "08:00" en 8 para poder comparar las horas
const hora = (texto) => Number(texto.slice(0, 2));

// un usuario puede tener varios turnos el mismo dia, pero no pueden cruzarse
// si no hay hora_fin, el turno dura solo su bloque de una hora
const verificarTraslape = async ({ rut_usuario, horario_id, hora_inicio, hora_fin }, idExcluir) => {
    const turnosDelDia = await prisma.turno.findMany({
        where: { rut_usuario, horario_id, NOT: { id: idExcluir } },
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

// service para crear un turno
// si el usuario o el dia no existen Prisma lanza P2003 (400) que responde error.middleware.js
export const crearTurno = async (data) => {
    await verificarTraslape(data);
    return prisma.turno.create({ data, include: incluirTurno });
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

// service para editar un turno
// se junta lo que llega con lo que ya tenia el turno para revisar las horas completas
export const actualizarTurno = async (id, data) => {
    const turno = await prisma.turno.findUnique({ where: { id } });
    if (!turno) throw new HttpError(404, 'Turno no encontrado');

    const turnoEditado = { ...turno, ...data };
    if (turnoEditado.hora_fin && turnoEditado.hora_fin <= turnoEditado.hora_inicio) {
        throw new HttpError(400, 'La hora de ida debe ser después de la hora de llegada');
    }
    await verificarTraslape(turnoEditado, id);

    return prisma.turno.update({ where: { id }, data, include: incluirTurno });
};

// service para borrar un turno, si no existe Prisma lanza P2025 (404)
export const eliminarTurno = (id) => {
    return prisma.turno.delete({ where: { id } });
};
