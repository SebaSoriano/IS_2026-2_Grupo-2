import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { ROLES } from '../config/roles.js';
import { isLowStock, sendLowStockNotification } from './email.service.js';

// datos del animal que se adjuntan a cada registro médico.
const animalResumen = { select: { id_animal: true, nombre_animal: true, especie_animal: true } };

// insumos usados en cada registro: la cantidad se lee de la tabla intermedia historial_insumo
// y el tipo, la descripción, la unidad de medida y el tipo de control se leen del insumo relacionado (tabla Insumo).
const insumosUsados = {
  select: {
    id_insumo: true,
    cantidad: true,
    insumo: { select: { tipo_insumo: true, descripcion: true, unidad_medida: true, tipo_control: true } },
  },
  orderBy: { id_insumo: 'asc' },
};

// lo que se adjunta a cada registro en todas las consultas, escrito una sola vez
const incluirEnRegistro = { animal: animalResumen, insumos: insumosUsados };

// Prisma entrega cada insumo anidado: { id_insumo, cantidad, insumo: { tipo_insumo, descripcion, ... } }.
// Esta función lo "aplana" a { id_insumo, cantidad, tipo_insumo, descripcion, unidad_medida, tipo_control },
// que es más fácil de mostrar en el frontend. Si el registro es null (no existe), devuelve null.
const formatearRegistro = (registro) =>
  registro && {
    ...registro,
    insumos: registro.insumos.map(({ id_insumo, cantidad, insumo }) => ({
      id_insumo,
      cantidad,
      ...insumo,
    })),
  };

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

  // insumo: registros que usaron AL MENOS UN insumo cuyo nombre contenga el texto.
  if (filtros.insumo) {
    where.insumos = {
      some: {
        insumo: {
          OR: [
            { descripcion: { contains: filtros.insumo, mode: 'insensitive' } },
            { tipo_insumo: { contains: filtros.insumo, mode: 'insensitive' } },
          ],
        },
      },
    };
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
      include: incluirEnRegistro,
    }),
  ]);

  return { total, pagina, limite, registros: registros.map(formatearRegistro) };
};


// Máximo de registros que se ponen en el PDF de la tabla (unas 40 páginas).
// Si hay más, el PDF incluye los más recientes y lo avisa en el encabezado.
export const MAXIMO_REGISTROS_PDF = 1000;

// Registros para exportar a PDF: los mismos filtros y el mismo orden que la tabla,
// pero sin páginas (todos los que coinciden, hasta MAXIMO_REGISTROS_PDF).
export const getHistorialesParaPdf = async (filtros) => {
  const where = construirFiltros(filtros);
  const [total, registros] = await Promise.all([
    prisma.historial_medico.count({ where }),
    prisma.historial_medico.findMany({
      where,
      orderBy: [{ fecha_tratamiento: 'desc' }, { id_historial: 'desc' }],
      take: MAXIMO_REGISTROS_PDF,
      include: { animal: animalResumen },
    }),
  ]);
  return { total, registros };
};

// Detalle de un registro médico. Si no existe, findUnique devuelve null
// y responde 404.
export const getHistorialById = async (id) => {
  const registro = await prisma.historial_medico.findUnique({
    where: { id_historial: id },
    include: incluirEnRegistro,
  });
  return formatearRegistro(registro);
};

// revisa que el animal exista antes de asociarle un registro médico.
const verificarAnimal = async (id_animal) => {
  const animal = await prisma.animales.findUnique({ where: { id_animal } });
  if (!animal) throw new HttpError(400, 'El animal indicado no existe');
};

// unidad de medida de un insumo escrita para un mensaje: 'kg' y 'g' se dejan igual
// y 'unidad' se escribe en plural, por ejemplo "quedan 3 unidades" o "quedan 12 kg".
const textoUnidad = (unidad_medida) => (unidad_medida === 'unidad' ? 'unidades' : unidad_medida);

// Descuenta "cantidad" de un insumo del inventario, usando la transacción "tx".
const descontarDelInventario = async (tx, id_insumo, cantidad) => {
  const { count } = await tx.insumo.updateMany({
    where: { id: id_insumo, cantidad: { gte: cantidad } },
    data: { cantidad: { decrement: cantidad } },
  });

  const insumo = await tx.insumo.findUnique({ where: { id: id_insumo } });

  // Si no se descontó, se busca la razón para dar un mensaje claro.
  // Lanzar el error dentro de la transacción hace que Prisma deshaga todo lo anterior.
  if (count === 0) {
    if (!insumo) throw new HttpError(400, `El insumo con id ${id_insumo} no existe en el inventario`);
    const nombre = insumo.descripcion ?? insumo.tipo_insumo;
    const unidad = textoUnidad(insumo.unidad_medida);
    throw new HttpError(
      409,
      `No hay stock suficiente de "${nombre}": hacen falta ${cantidad} ${unidad} y en el inventario quedan ${insumo.cantidad} ${unidad}`,
    );
  }

  return insumo;
};

// Suma "cantidad" de un insumo al inventario
// Se usa cuando al modificar un registro se baja la cantidad usada o se quita un insumo,
// y cuando se elimina un registro médico.
const devolverAlInventario = (tx, id_insumo, cantidad) =>
  tx.insumo.update({
    where: { id: id_insumo },
    data: { cantidad: { increment: cantidad } },
  });

// Revisa la lista de insumos que llegó del formulario contra la tabla Insumo y la deja lista para guardar.
// Se necesita consultar la base de datos porque el schema no sabe de qué tipo es cada insumo:
const prepararInsumos = async (tx, insumos) => {
  // "in" trae de una vez todos los insumos cuyos id estén en la lista
  const filas = await tx.insumo.findMany({ where: { id: { in: insumos.map((uso) => uso.id_insumo) } } });
  const insumoPorId = new Map(filas.map((insumo) => [insumo.id, insumo]));

  const usados = insumos.map(({ id_insumo, cantidad }) => {
    const insumo = insumoPorId.get(id_insumo);
    if (!insumo) throw new HttpError(400, `El insumo con id ${id_insumo} no existe en el inventario`);
    if (insumo.tipo_control === 'estado') return { id_insumo, cantidad: null };
    if (cantidad == null) {
      throw new HttpError(400, `Indica cuánto se usó de "${insumo.descripcion ?? insumo.tipo_insumo}"`);
    }
    return { id_insumo, cantidad };
  });

  return { usados, insumoPorId };
};

// Abre los envases de los insumos de tipo "estado" que se usan por PRIMERA VEZ en este registro
// (están en "nuevos" y no estaban en "anteriores"). No descuenta stock ni crea movimientos:
// eso pasa recién cuando alguien aprieta "Se terminó" en Inventario.
const abrirEnvases = async (tx, anteriores, nuevos, insumoPorId) => {
  const idsAnteriores = new Set(anteriores.map((uso) => uso.id_insumo));

  for (const { id_insumo } of nuevos) {
    const insumo = insumoPorId.get(id_insumo);
    if (insumo.tipo_control !== 'estado' || idsAnteriores.has(id_insumo)) continue;

    if (insumo.estado_envase === 'terminado' || insumo.cantidad === 0) {
      throw new HttpError(409, `"${insumo.descripcion ?? insumo.tipo_insumo}" está terminado: no quedan envases en el inventario`);
    }
    if (insumo.estado_envase === 'cerrado') {
      await tx.insumo.update({
        where: { id: id_insumo },
        data: { estado_envase: 'abierto', fecha_apertura: new Date() },
      });
    }
  }
};

// Ajusta el inventario según la diferencia entre los insumos que el registro tenía antes
// ("anteriores") y los que debe tener ahora ("nuevos").
const ajustarInventario = async (tx, anteriores, nuevos) => {
  // Solo cuentan los insumos con cantidad (los "contables"). Los de tipo "estado" tienen
  // cantidad null y no se descuentan aquí: su envase se maneja con abrirEnvases.
  const contables = (lista) => lista.filter((uso) => uso.cantidad != null);

  // Un Map de id_insumo -> cantidad, para buscar rápido cuánto se usaba antes y cuánto ahora
  const cantidadAnterior = new Map(contables(anteriores).map((uso) => [uso.id_insumo, uso.cantidad]));
  const cantidadNueva = new Map(contables(nuevos).map((uso) => [uso.id_insumo, uso.cantidad]));
  // Todos los insumos que aparecen en alguna de las dos listas, cada uno una sola vez
  const ids = new Set([...cantidadAnterior.keys(), ...cantidadNueva.keys()]);

  const movimientos = [];
  const insumosConStockBajo = [];

  for (const id_insumo of ids) {
    const diferencia = (cantidadNueva.get(id_insumo) ?? 0) - (cantidadAnterior.get(id_insumo) ?? 0);

    if (diferencia > 0) {
      const insumo = await descontarDelInventario(tx, id_insumo, diferencia);
      movimientos.push({ id_insumo, tipo: 'salida', cantidad: diferencia });
      // Solo se avisa cuando el insumo PASA a stock bajo con este descuento
      // (antes tenía más del límite y ahora quedó en el límite o por debajo).
      if (!isLowStock(insumo.cantidad + diferencia) && isLowStock(insumo.cantidad)) {
        insumosConStockBajo.push(insumo);
      }
    } else if (diferencia < 0) {
      // -diferencia convierte el -1 del ejemplo en 1 que se devuelve
      await devolverAlInventario(tx, id_insumo, -diferencia);
      movimientos.push({ id_insumo, tipo: 'devolucion', cantidad: -diferencia });
    }
  }

  return { movimientos, insumosConStockBajo };
};

// Anota en la tabla movimiento_insumo cada salida o devolución que hizo ajustarInventario.
// - descripcion: explica de dónde vino el movimiento, por ejemplo
//   "Registro médico #52: Vacuna antirrábica (Toby)". Se guarda como texto (y no solo el id)
const registrarMovimientos = (tx, movimientos, { registro, rut_usuario, accion }) =>
  tx.movimiento_insumo.createMany({
    data: movimientos.map((movimiento) => ({
      ...movimiento,
      rut_usuario,
      id_historial: registro.id_historial,
      descripcion: `${accion} #${registro.id_historial}: ${registro.tratamiento} (${registro.animal.nombre_animal})`.slice(0, 255),
    })),
  });

// Manda el correo de stock bajo, igual que lo hace insumo.controller.js al editar un insumo.
const avisarStockBajo = async (insumos) => {
  for (const insumo of insumos) {
    try {
      await sendLowStockNotification(insumo);
    } catch (error) {
      console.error(`No se pudo enviar el aviso de stock bajo del insumo ${insumo.id}:`, error);
    }
  }
};

// crea un registro médico, descuenta del inventario los insumos que se usaron
// y anota una salida en movimiento_insumo por cada insumo.
export const createHistorial = async ({ insumos, ...datos }, rut_usuario) => {
  await verificarAnimal(datos.id_animal);

  // $transaction agrupa varias consultas en un "todo o nada": si cualquier paso lanza un error,
  // la base de datos deshace los pasos anteriores. Así nunca queda un registro médico guardado
  // con el stock sin descontar, ni stock descontado sin su registro médico o sin su movimiento.
  const { registro, insumosConStockBajo } = await prisma.$transaction(async (tx) => {
    const { usados, insumoPorId } = await prepararInsumos(tx, insumos);
    // el registro es nuevo, así que no tenía insumos antes: todo se descuenta
    // y todos los envases que se usan se abren
    const { movimientos, insumosConStockBajo } = await ajustarInventario(tx, [], usados);
    await abrirEnvases(tx, [], usados, insumoPorId);

    // create anidado: junto con el registro se crean sus filas en historial_insumo.
    // No hace falta indicar id_historial, porque Prisma lo completa con el id del registro nuevo.
    const registro = await tx.historial_medico.create({
      data: { ...datos, insumos: { create: usados } },
      include: incluirEnRegistro,
    });

    // la salida se anota después de crear el registro, porque necesita su id
    await registrarMovimientos(tx, movimientos, { registro, rut_usuario, accion: 'Registro médico' });

    return { registro, insumosConStockBajo };
  });

  await avisarStockBajo(insumosConStockBajo);
  return formatearRegistro(registro);
};

// edita un registro médico. Solo se revisa el animal si se está cambiando.
export const updateHistorial = async (id, { insumos, ...datos }, rut_usuario) => {
  if (datos.id_animal) await verificarAnimal(datos.id_animal);

  const { registro, insumosConStockBajo } = await prisma.$transaction(async (tx) => {
    let movimientos = [];
    let insumosConStockBajo = [];

    if (insumos !== undefined) {
      const { usados, insumoPorId } = await prepararInsumos(tx, insumos);
      // lo que el registro tenía guardado antes de este cambio
      const anteriores = await tx.historial_insumo.findMany({ where: { id_historial: id } });
      ({ movimientos, insumosConStockBajo } = await ajustarInventario(tx, anteriores, usados));
      await abrirEnvases(tx, anteriores, usados, insumoPorId);
      // deleteMany: {} borra todas las filas de historial_insumo de ESTE registro,
      // y create vuelve a crear las de la lista nueva. Es más simple que revisar
      // una por una cuál se agregó, cuál cambió y cuál se quitó.
      datos.insumos = { deleteMany: {}, create: usados };
    }

    // Si el registro no existe, Prisma lanza P2025 (responde 404) y la transacción
    // deshace los ajustes de inventario que se hubieran hecho arriba.
    const registro = await tx.historial_medico.update({
      where: { id_historial: id },
      data: datos,
      include: incluirEnRegistro,
    });

    await registrarMovimientos(tx, movimientos, { registro, rut_usuario, accion: 'Modificación del registro médico' });

    return { registro, insumosConStockBajo };
  });

  await avisarStockBajo(insumosConStockBajo);
  return formatearRegistro(registro);
};

// elimina un registro médico y devuelve al inventario todo lo que había usado,
export const deleteHistorial = (id, rut_usuario) =>
  prisma.$transaction(async (tx) => {
    const registro = await tx.historial_medico.findUnique({
      where: { id_historial: id },
      include: incluirEnRegistro,
    });
    if (!registro) throw new HttpError(404, 'Registro médico no encontrado');

    // "nuevos" es una lista vacía: el registro ya no usará nada, así que todo se devuelve
    const { movimientos } = await ajustarInventario(tx, registro.insumos, []);
    await registrarMovimientos(tx, movimientos, { registro, rut_usuario, accion: 'Eliminación del registro médico' });

    return tx.historial_medico.delete({ where: { id_historial: id } });
  });

// nombres de veterinarios para la búsqueda con predicción del frontend.
// junta dos fuentes, porque el veterinario de un registro es un texto libre
export const getVeterinarios = async () => {
  const [enHistorial, usuarios] = await Promise.all([
    prisma.historial_medico.findMany({ distinct: ['veterinario'], select: { veterinario: true } }),
    prisma.usuario.findMany({
      where: { rol: { nombre: ROLES.VETERINARIA } },
      select: { nombre_usuario: true },
    }),
  ]);

  const nombres = new Set([
    ...enHistorial.map((registro) => registro.veterinario),
    ...usuarios.map((usuario) => usuario.nombre_usuario),
  ]);
  return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
};