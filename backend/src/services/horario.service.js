//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';
import { hoy, lunesDeLaSemana, sumarDias } from '../utils/fechas.js';

// service para obtener el horario de una semana (de lunes a domingo): los 7 dias (1 = Lunes ... 7 = Domingo)
// cada uno con su fecha y sus turnos de esa semana, ordenados por hora de llegada y con el usuario que lo tiene
// semana es cualquier dia de la semana que se quiere ver, si no viene se usa la semana actual
export const obtenerHorarios = async (semana = hoy()) => {
    const lunes = lunesDeLaSemana(semana);
    const lunesSiguiente = sumarDias(lunes, 7);

    const horarios = await prisma.horario.findMany({
        orderBy: { id: 'asc' },
        include: {
            turnos: {
                where: { fecha: { gte: lunes, lt: lunesSiguiente } },
                orderBy: { hora_inicio: 'asc' },
                include: { usuario: usuarioPublico },
            },
        },
    });

    // se agrega la fecha de cada dia para poder mostrarla en la tabla, ej: Lunes 12
    return horarios.map((horario) => ({ ...horario, fecha: sumarDias(lunes, horario.id - 1) }));
};
