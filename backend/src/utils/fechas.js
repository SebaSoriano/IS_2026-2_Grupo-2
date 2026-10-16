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


// Un "periodo" es una fecha escrita con más o menos detalle, para los filtros del historial médico:
//   "2025"        -> todo el año 2025
//   "2025-03"     -> todo marzo de 2025
//   "2025-03-06"  -> solo el 6 de marzo de 2025
// Esta expresión regular separa el año, el mes y el día (los dos últimos son opcionales).
export const formatoPeriodo = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

// Convierte un periodo en el primer instante que abarca, a las 00:00 UTC.
// "2025-03" -> 1 de marzo de 2025. Si falta el mes o el día, se usa el 01.
export const inicioPeriodo = (texto) => {
    const [, anio, mes = '01', dia = '01'] = formatoPeriodo.exec(texto);
    return new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
};

// Convierte un periodo en el primer instante DESPUÉS de que termina.
// "2025-03"    -> 1 de abril de 2025
// "2025-03-06" -> 7 de marzo de 2025
// Luego se busca con "menor que" (lt) esta fecha, así entra el día, mes o año completo.
export const finPeriodo = (texto) => {
    const [, , mes, dia] = formatoPeriodo.exec(texto);
    const fin = inicioPeriodo(texto);
    if (dia) fin.setUTCDate(fin.getUTCDate() + 1);
    else if (mes) fin.setUTCMonth(fin.getUTCMonth() + 1);
    else fin.setUTCFullYear(fin.getUTCFullYear() + 1);
    return fin;
};