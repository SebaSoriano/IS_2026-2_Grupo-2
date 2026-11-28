// funciones de fechas para los turnos: las fechas se guardan solo con el dia (@db.Date), a las 00:00 UTC

// "2026-10-15" -> Date del dia a las 00:00 UTC, igual a como lo guarda Prisma
export const fechaDesdeTexto = (texto) => new Date(`${texto}T00:00:00.000Z`);

// el refugio esta en Chile: la fecha y la hora de "ahora" se calculan siempre en esa zona horaria,
// sin importar la zona horaria del servidor (ej: un contenedor en UTC)
const formatoChile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

// fecha (Date del dia a las 00:00 UTC, igual que los turnos) y hora ("HH:MM") de este momento en Chile
export const ahoraEnChile = () => {
    const partes = Object.fromEntries(formatoChile.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return {
        fecha: fechaDesdeTexto(`${partes.year}-${partes.month}-${partes.day}`),
        hora: `${partes.hour}:${partes.minute}`,
    };
};

// fecha de hoy sin hora, para comparar si un turno ya paso o aun no llega
export const hoy = () => ahoraEnChile().fecha;

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

// Escribe una fecha en formato chileno DD-MM-AAAA (ej: 06-03-2025), para los PDF.
// Se usan los métodos getUTC... porque las fechas se guardan a las 00:00 UTC.
export const fechaChilena = (fecha) => {
    const dosDigitos = (numero) => String(numero).padStart(2, '0');
    return `${dosDigitos(fecha.getUTCDate())}-${dosDigitos(fecha.getUTCMonth() + 1)}-${fecha.getUTCFullYear()}`;
};

const horaChile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

// Día (00:00 UTC, como los turnos) -> instante exacto en que empieza ese día en Chile.
// Chile está en UTC-3 o UTC-4 según el horario de verano: se prueba cuál da medianoche
export const inicioDelDiaEnChile = (fecha) => {
    for (const horas of [3, 4]) {
        const instante = new Date(fecha.getTime() + horas * 60 * 60 * 1000);
        if (horaChile.format(instante) === '00:00') return instante;
    }
    return new Date(fecha.getTime() + 4 * 60 * 60 * 1000);
};