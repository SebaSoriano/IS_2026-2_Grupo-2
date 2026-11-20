//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';
import { obtenerUsuarioPorRut } from './usuario.service.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { ahoraEnChile, diaDelHorario, hoy } from '../utils/fechas.js';
import { ROLES } from '../config/roles.js';

const incluirTurno = { usuario: usuarioPublico, dia_semana: true };
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
// el dia de la semana (dia_semana_id) sale de la fecha
// si el usuario no existe Prisma lanza P2003 (400) que responde error.middleware.js
// solo el Admin puede añadir turnos a nombre de otra persona;
// Veterinaria y Voluntario solo pueden añadirlos a su propio nombre (sesion = req.usuario: { rut, rol })
export const crearTurno = async (data, sesion) => {
    if (sesion?.rol !== ROLES.ADMIN && data.rut_usuario !== sesion?.rut) {
        throw new HttpError(403, 'Solo puedes añadir turnos a tu nombre');
    }
    verificarQueNoEsPasado(data.fecha, 'No se pueden añadir turnos en días que ya pasaron');
    await verificarTraslape(data);
    return prisma.turno.create({
        data: { ...data, dia_semana_id: diaDelHorario(data.fecha) },
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
// solo el Admin puede cambiar la persona del turno; la Veterinaria edita el resto de los datos
export const actualizarTurno = async (id, data, sesion) => {
    const turno = await obtenerTurnoPorId(id);
    if (sesion?.rol !== ROLES.ADMIN && data.rut_usuario && data.rut_usuario !== turno.rut_usuario) {
        throw new HttpError(403, 'Solo el administrador puede cambiar la persona del turno');
    }
    verificarQueNoEsPasado(turno.fecha, 'No se puede editar un turno de un día que ya pasó');

    const turnoEditado = { ...turno, ...data };
    verificarQueNoEsPasado(turnoEditado.fecha, 'No se puede mover un turno a un día que ya pasó');
    if (turnoEditado.hora_fin && turnoEditado.hora_fin <= turnoEditado.hora_inicio) {
        throw new HttpError(400, 'La hora de ida debe ser después de la hora de llegada');
    }
    await verificarTraslape(turnoEditado, id);

    // si cambia la fecha, tambien cambia el dia de la semana
    const cambios = data.fecha ? { ...data, dia_semana_id: diaDelHorario(data.fecha) } : data;
    return prisma.turno.update({ where: { id }, data: cambios, include: incluirTurno });
};

// service para borrar un turno que aun no pasa
export const eliminarTurno = async (id) => {
    const turno = await obtenerTurnoPorId(id);
    verificarQueNoEsPasado(turno.fecha, 'No se puede borrar un turno de un día que ya pasó');
    return prisma.turno.delete({ where: { id } });
};

// ---------- Asistencia: llegada al turno ----------
// la persona registra su llegada con el boton "Llegué" y se guarda la hora (hora_llegada)
// el boton aparece desde ANTICIPACION_MINUTOS antes del inicio del turno hasta que el turno termina
// cuenta como "a la hora" si llego hasta TOLERANCIA_MINUTOS despues del inicio
export const ANTICIPACION_MINUTOS = 10;
export const TOLERANCIA_MINUTOS = 25;

// convierte "08:30" en minutos desde las 00:00 (510) para comparar horas con minutos
const minutos = (texto) => Number(texto.slice(0, 2)) * 60 + Number(texto.slice(3, 5));

// minuto en que termina el turno; si no hay hora_fin, el turno dura solo su bloque de una hora
const finDelTurno = (turno) => (turno.hora_fin ? minutos(turno.hora_fin) : minutos(turno.hora_inicio) + 60);

// estado de la asistencia de un turno, se calcula con hora_llegada y la hora actual:
// - 'a-tiempo': llego hasta TOLERANCIA_MINUTOS despues del inicio
// - 'tarde': llego despues de la tolerancia
// - 'ausente': el turno ya termino y no registro llegada
// - 'pendiente': el turno aun no termina y todavia no registra llegada
export const estadoAsistencia = (turno, ahora = ahoraEnChile()) => {
    if (turno.hora_llegada) {
        return minutos(turno.hora_llegada) <= minutos(turno.hora_inicio) + TOLERANCIA_MINUTOS ? 'a-tiempo' : 'tarde';
    }
    const fechaTurno = turno.fecha.getTime();
    const fechaHoy = ahora.fecha.getTime();
    const yaTermino = fechaTurno < fechaHoy || (fechaTurno === fechaHoy && minutos(ahora.hora) >= finDelTurno(turno));
    return yaTermino ? 'ausente' : 'pendiente';
};

// agrega el estado de la asistencia al turno que se responde
export const conEstado = (turno, ahora = ahoraEnChile()) => ({ ...turno, estado: estadoAsistencia(turno, ahora) });

// turno de hoy de la persona en que puede registrar su llegada en este momento, o null si no hay
// los turnos de un usuario no se cruzan, pero la anticipacion del siguiente puede tocar el final del anterior:
// en ese caso se elige el primero que aun no tiene llegada
const buscarTurnoParaLlegada = async (rut, ahora) => {
    const turnosDeHoy = await prisma.turno.findMany({
        where: { rut_usuario: rut, fecha: ahora.fecha, hora_llegada: null },
        orderBy: { hora_inicio: 'asc' },
    });
    const minutoActual = minutos(ahora.hora);
    return turnosDeHoy.find((turno) =>
        minutoActual >= minutos(turno.hora_inicio) - ANTICIPACION_MINUTOS && minutoActual < finDelTurno(turno),
    ) ?? null;
};

// service para saber si la persona de la sesion puede apretar "Llegué" ahora (sesion = req.usuario: { rut, rol })
export const obtenerTurnoParaLlegada = async (sesion) => {
    const turno = await buscarTurnoParaLlegada(sesion.rut, ahoraEnChile());
    return turno ? conEstado(turno) : null;
};

// service para registrar la llegada de la persona de la sesion a su turno actual
// la hora la pone el servidor, asi nadie puede mandar una hora distinta desde el navegador
export const registrarLlegada = async (sesion) => {
    const ahora = ahoraEnChile();
    const turno = await buscarTurnoParaLlegada(sesion.rut, ahora);
    if (!turno) throw new HttpError(400, 'No tienes un turno en curso para registrar tu llegada');

    const actualizado = await prisma.turno.update({
        where: { id: turno.id },
        data: { hora_llegada: ahora.hora },
        include: incluirTurno,
    });
    return conEstado(actualizado, ahora);
};

// service para que el Admin corrija la asistencia a mano (ej: alguien olvido apretar "Llegué")
// llego = true la deja como llegada a la hora (con la hora de inicio del turno), false borra la llegada
// solo se puede en turnos de hoy o de dias que ya pasaron
export const marcarAsistenciaTurno = async (id, { llego }) => {
    const turno = await obtenerTurnoPorId(id);
    if (turno.fecha > hoy()) throw new HttpError(400, 'No se puede marcar asistencia en un turno que aún no llega');

    const actualizado = await prisma.turno.update({
        where: { id },
        data: { hora_llegada: llego ? turno.hora_inicio : null },
        include: incluirTurno,
    });
    return conEstado(actualizado);
};
