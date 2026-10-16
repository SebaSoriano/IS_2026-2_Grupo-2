import prisma from '../config/prisma.js';

// datos del animal que se adjuntan a cada registro médico.
const animalResumen = { select: { id_animal: true, nombre_animal: true, especie_animal: true } };

// traduce los filtros que llegan desde la URL al algo que entiende Prisma.
const construirFiltros = (filtros) => {
  const where = {};

  // contains busca el texto en cualquier parte y mode
  // así "choco" encuentra "Chocolito" y "gonzalez" encuentra "Dra. Sofia Gonzalez".
  // Prisma hace el JOIN entre historial_medico y animales por su cuenta.
  if (filtros.animal) {
    where.animal = { nombre_animal: { contains: filtros.animal, mode: 'insensitive' } };
  }
  if (filtros.veterinario) {
    where.veterinario = { contains: filtros.veterinario, mode: 'insensitive' };
  }

  // rango de fechas: gte significa "mayor o igual que" y lt "menor que".
  // Las fechas ya vienen convertidas desde historial.schema.js
  if (filtros.desde || filtros.hasta) {
    where.fecha_tratamiento = {};
    if (filtros.desde) where.fecha_tratamiento.gte = filtros.desde;
    if (filtros.hasta) where.fecha_tratamiento.lt = filtros.hasta;
  }

  return where;
};

// listado de registros médicos, del más reciente al más antiguo
// además de los registros devuelve el total, para que el frontend sepa cuántas páginas hay.
export const getHistoriales = async (filtros) => {
  const { limite, pagina } = filtros;
  const where = construirFiltros(filtros);

  // promise.all ejecuta las dos consultas al mismo tiempo y espera a que terminen ambas
  const [total, registros] = await Promise.all([
    prisma.historial_medico.count({ where }),
    prisma.historial_medico.findMany({
      where,
      // Si dos registros tienen la misma fecha, se muestra primero el último que se ingresó
      orderBy: [{ fecha_tratamiento: 'desc' }, { id_historial: 'desc' }],
      skip: (pagina - 1) * limite, // registros que se saltan (los de las páginas anteriores)
      take: limite,                // registros que se devuelven
      include: { animal: animalResumen },
    }),
  ]);

  return { total, pagina, limite, registros };
};