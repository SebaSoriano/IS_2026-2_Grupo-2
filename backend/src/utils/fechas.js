// funciones de fechas para los turnos: las fechas se guardan solo con el dia (@db.Date), a las 00:00 UTC

// "2026-10-15" -> Date del dia a las 00:00 UTC, igual a como lo guarda Prisma
export const fechaDesdeTexto = (texto) => new Date(`${texto}T00:00:00.000Z`);

// fecha de hoy sin hora, para comparar si un turno ya paso o aun no llega
export const hoy = () => {
    const ahora = new Date();
    return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
};

// dia de la semana de una fecha igual que el id del horario (1 = Lunes ... 7 = Domingo)
// getUTCDay devuelve 0 para el domingo, por eso se cambia a 7
export const diaDelHorario = (fecha) => fecha.getUTCDay() || 7;

// suma (o resta) dias a una fecha
export const sumarDias = (fecha, dias) => new Date(fecha.getTime() + dias * 24 * 60 * 60 * 1000);

// lunes de la semana de una fecha, las semanas van de lunes a domingo
export const lunesDeLaSemana = (fecha) => sumarDias(fecha, 1 - diaDelHorario(fecha));
