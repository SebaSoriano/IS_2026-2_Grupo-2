import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { borrarComprobante, guardarComprobante, rutaComprobante } from '../utils/comprobantes.js';

const usuarioPublico = { select: { rut_usuario: true, nombre_usuario: true } };
const incluir = { usuario: usuarioPublico, insumos: true };

// Desde qué estado se puede pasar a cuáles
const TRANSICIONES = {
  pendiente: ['agendada', 'confirmada'],
  agendada: ['confirmada'],
  confirmada: [],
};

const verificarTransicion = (actual, nuevo) => {
  if (!TRANSICIONES[actual].includes(nuevo)) {
    throw new HttpError(409, `No se puede pasar de "${actual}" a "${nuevo}"`);
  }
};

const obtenerDonacion = async (id_donacion) => {
  const donacion = await prisma.donaciones.findUnique({ where: { id_donacion } });
  if (!donacion) throw new HttpError(404, 'Donación no encontrada');
  return donacion;
};

// Una donación de insumos necesita el detalle de lo recibido; una monetaria no puede traerlo
const verificarInsumos = (tipo, insumos) => {
  if (tipo === 'insumos' && !insumos) throw new HttpError(400, 'Indica los insumos recibidos');
  if (tipo === 'monetaria' && insumos) throw new HttpError(400, 'Los insumos solo aplican a donaciones de insumos');
};

const filasDeInsumo = (insumos, id_donacion, rut_usuario) =>
  insumos.map((insumo) => ({ ...insumo, id_donacion, rut_usuario, fecha_ingreso: new Date() }));

// Registro presencial: ya está recibida, así que nace confirmada
export const createDonacionPresencial = async ({ insumos, ...datos }) => {
  verificarInsumos(datos.tipo_donacion, insumos);
  const fecha = datos.fecha_donacion ?? new Date();

  // Transacción: o se guarda la donación Y sus insumos, o no se guarda nada
  return prisma.$transaction(async (tx) => {
    const { id_donacion } = await tx.donaciones.create({
      data: { ...datos, origen: 'presencial', estado: 'confirmada', fecha_donacion: fecha, fecha_confirmacion: fecha },
    });
    if (insumos) await tx.insumo.createMany({ data: filasDeInsumo(insumos, id_donacion, datos.rut_usuario) });
    return tx.donaciones.findUnique({ where: { id_donacion }, include: incluir });
  });
};

// Formulario público: nace pendiente, el estado y el origen los decide el servidor, no el cliente
// Formulario público: nace pendiente. archivo = req.file de multer (o undefined)
export const createDonacionWeb = async (datos, archivo) => {
  if (datos.tipo_donacion === 'monetaria') {
    if (!archivo) throw new HttpError(400, 'Adjunta el comprobante de la transferencia (JPG o PNG)');
    const cuenta = await prisma.cuenta_transferencia.findUnique({ where: { id_cuenta: datos.id_cuenta } });
    if (!cuenta || !cuenta.activa) throw new HttpError(400, 'La cuenta indicada no está disponible');
  } else if (archivo) {
    throw new HttpError(400, 'El comprobante solo aplica a donaciones monetarias');
  }

  // El archivo se guarda al final, cuando todo lo demás ya pasó las validaciones
  const comprobante_url = archivo ? await guardarComprobante(archivo) : undefined;

  try {
    return await prisma.donaciones.create({
      data: { ...datos, comprobante_url, origen: 'web', estado: 'pendiente', fecha_donacion: new Date() },
      include: incluir,
    });
  } catch (error) {
    // si la base de datos falla, no se deja un archivo huérfano en disco
    if (comprobante_url) await borrarComprobante(comprobante_url);
    throw error;
  }
};

export const getComprobante = async (id) => {
  const donacion = await obtenerDonacion(id);
  if (!donacion.comprobante_url) throw new HttpError(404, 'Esta donación no tiene comprobante');
  return rutaComprobante(donacion.comprobante_url);
};

// Si tenía comprobante, también se borra el archivo. Los insumos ya recibidos quedan en el inventario
export const deleteDonacion = async (id_donacion) => {
  const donacion = await obtenerDonacion(id_donacion);
  await prisma.donaciones.delete({ where: { id_donacion } });
  if (donacion.comprobante_url) await borrarComprobante(donacion.comprobante_url);
};

export const getAllDonaciones = (filtros = {}) =>
  prisma.donaciones.findMany({
    where: filtros,
    orderBy: { fecha_donacion: 'desc' },
    include: incluir,
  });

export const getDonacionById = async (id) => {
  const donacion = await prisma.donaciones.findUnique({ where: { id_donacion: id }, include: incluir });
  if (!donacion) throw new HttpError(404, 'Donación no encontrada');
  return donacion;
};

const CAMPOS_MONETARIOS = ['monto_donacion', 'metodo_pago', 'comprobante_url'];

// Se puede editar en cualquier estado (el voluntario puede haberse equivocado)
export const updateDonacion = async (id, datos) => {
  const donacion = await obtenerDonacion(id);

  if (donacion.tipo_donacion === 'insumos') {
    if (CAMPOS_MONETARIOS.some((c) => datos[c] !== undefined)) {
      throw new HttpError(400, 'Monto, método de pago y comprobante solo aplican a donaciones monetarias');
    }
  } else if (datos.descripcion_insumos !== undefined) {
    throw new HttpError(400, 'La descripción de insumos solo aplica a donaciones de insumos');
  }

  // Se junta lo guardado con lo nuevo para revisar el resultado final (igual que en turnos)
  const final = { ...donacion, ...datos };
  if (final.comprobante_url && final.metodo_pago !== 'transferencia') {
    throw new HttpError(400, 'El comprobante solo aplica a transferencias');
  }

  return prisma.donaciones.update({ where: { id_donacion: id }, data: datos, include: incluir });
};

export const agendarDonacion = async (id, { fecha_agendada }) => {
  const donacion = await obtenerDonacion(id);
  verificarTransicion(donacion.estado, 'agendada');
  return prisma.donaciones.update({
    where: { id_donacion: id },
    data: { estado: 'agendada', fecha_agendada },
    include: incluir,
  });
};

export const confirmarDonacion = async (id, { rut_usuario, insumos }) => {
  const donacion = await obtenerDonacion(id);
  verificarTransicion(donacion.estado, 'confirmada');
  verificarInsumos(donacion.tipo_donacion, insumos);

  return prisma.$transaction(async (tx) => {
    // El "where estado" evita doble confirmación: si dos voluntarios confirman a la vez,
    // solo uno actualiza una fila y el otro recibe 409 (así no se duplican los insumos)
    const { count } = await tx.donaciones.updateMany({
      where: { id_donacion: id, estado: donacion.estado },
      data: { estado: 'confirmada', fecha_confirmacion: new Date(), rut_usuario },
    });
    if (count === 0) throw new HttpError(409, 'La donación cambió de estado, actualiza e inténtalo de nuevo');

    if (insumos) await tx.insumo.createMany({ data: filasDeInsumo(insumos, id, rut_usuario) });
    return tx.donaciones.findUnique({ where: { id_donacion: id }, include: incluir });
  });
};
