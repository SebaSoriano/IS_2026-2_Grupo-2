import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { hoy, sumarDias } from '../utils/fechas.js';
import {
  VACUNAS,
  DESPARASITACIONES,
  ESTERILIZACION,
  MICROCHIP,
  DIAS_AVISO_POR_VENCER,
} from '../config/saludPublica.js';

// Lo que se le pide a la base de datos del historial de un animal para calcular su salud
export const historialParaSalud = {
  select: { tratamiento: true, fecha_tratamiento: true },
  orderBy: { fecha_tratamiento: 'desc' },
};

// Deja un texto listo para comparar
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Revisa si una vacuna se le revisa a la especie del animal
function aplicaALaEspecie(vacuna, especie) {
  if (vacuna.especies === 'todas') return true;
  const especieNormalizada = normalizar(especie);
  return vacuna.especies.some((nombre) => especieNormalizada.includes(nombre));
}

// Recibe la fecha en que se hizo un procedimiento y cuántos días dura,
// y devuelve hasta cuándo sirve y en qué estado está hoy
// - 'sin_registro': nunca se hizo en el hogar
// - 'vencida': la fecha de vencimiento ya pasó
// - 'por_vencer': vence dentro de los próximos DIAS_AVISO_POR_VENCER días (15)
// - 'al_dia': todavía le queda más que eso
// Las fechas se guardan a las 00:00 UTC, igual que hoy(), así que se pueden comparar directo.
function calcularVigencia(ultimaFecha, vigenciaDias) {
  if (!ultimaFecha) {
    return { ultima_fecha: null, vence: null, estado: 'sin_registro' };
  }
  const vence = sumarDias(ultimaFecha, vigenciaDias);
  const hoyChile = hoy();

  let estado = 'al_dia';
  if (vence < hoyChile) {
    estado = 'vencida';
  } else if (vence <= sumarDias(hoyChile, DIAS_AVISO_POR_VENCER)) {
    estado = 'por_vencer';
  }
  return { ultima_fecha: ultimaFecha, vence, estado };
}

// Recibe el historial de un animal (del más nuevo al más antiguo) y devuelve una función
// que dice la fecha MÁS RECIENTE en que se hizo cualquiera de los nombres que se le pasan.
function crearBuscadorDeFechas(historial) {
  const ultimaVez = new Map();
  for (const registro of historial) {
    const nombre = normalizar(registro.tratamiento);
    if (!ultimaVez.has(nombre)) {
      ultimaVez.set(nombre, registro.fecha_tratamiento);
    }
  }

  return (nombres) => {
    const fechas = nombres
      .map((nombre) => ultimaVez.get(normalizar(nombre)))
      .filter((fecha) => fecha !== undefined);
    if (fechas.length === 0) return null;
    return new Date(Math.max(...fechas.map((fecha) => fecha.getTime())));
  };
}

// Estado de cada vacuna de un animal, una por una.
export function resumenVacunas(especie, historial) {
  const ultimaFechaDe = crearBuscadorDeFechas(historial);

  return VACUNAS
    .filter((vacuna) => aplicaALaEspecie(vacuna, especie))
    .map((vacuna) => ({
      nombre: vacuna.nombre,
      obligatoria: vacuna.obligatoria,
      ...calcularVigencia(ultimaFechaDe([vacuna.nombre]), vacuna.vigenciaDias),
    }))
    .filter((vacuna) => vacuna.obligatoria || vacuna.estado !== 'sin_registro');
}

// Arma el resumen de salud de un animal para el "Ver detalles" de la página pública.
export async function getSaludPublica(id) {
  const animal = await prisma.animales.findUnique({
    where: { id_animal: id },
    select: {
      id_animal: true,
      nombre_animal: true,
      especie_animal: true,
      sexo_animal: true,
      estado_animal: true,
      historial: historialParaSalud,
    },
  });

  // Un animal que no está disponible (adoptado, en proceso o fallecido) no aparece en la página pública,
  // así que tampoco se entrega su información de salud. Se responde 404 igual que si no existiera,
  // para que la página pública no pueda averiguar qué animales hay en el hogar probando ids.
  if (!animal || animal.estado_animal !== 'disponible') {
    throw new HttpError(404, 'El animal no está disponible para adopción');
  }

  const ultimaFechaDe = crearBuscadorDeFechas(animal.historial);

  // Esterilización y microchip se hacen una sola vez, así que no vencen: basta con saber si hay un registro
  const fechaEsterilizacion = ultimaFechaDe(ESTERILIZACION);
  const fechaMicrochip = ultimaFechaDe(MICROCHIP);

  return {
    id_animal: animal.id_animal,
    nombre_animal: animal.nombre_animal,
    sexo_animal: animal.sexo_animal,
    vacunas: resumenVacunas(animal.especie_animal, animal.historial),
    desparasitaciones: DESPARASITACIONES.map((desparasitacion) => ({
      tipo: desparasitacion.tipo,
      ...calcularVigencia(ultimaFechaDe([desparasitacion.nombre]), desparasitacion.vigenciaDias),
    })),
    esterilizado: {
      valor: fechaEsterilizacion !== null,
      fecha: fechaEsterilizacion,
    },
    microchip: {
      valor: fechaMicrochip !== null,
      fecha: fechaMicrochip,
    },
    // Última atención veterinaria
    ultima_atencion: animal.historial.length > 0 ? animal.historial[0].fecha_tratamiento : null,
  };
}