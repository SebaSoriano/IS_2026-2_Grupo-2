import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { borrarComprobante, guardarComprobante, rutaComprobante } from '../utils/comprobantes.js';
import { sendDonacionConfirmadaNotification } from './email.service.js';

const usuarioPublico = { select: { rut_usuario: true, nombre_usuario: true } };
const cuentaPublica = { select: { id_cuenta: true, banco: true, titular_nombre: true, rut_usuario: true } };
const incluir = { usuario: usuarioPublico, insumos: true, cuenta: cuentaPublica };

// Desde qué estado se puede pasar a cuáles
const TRANSICIONES = {
  pendiente: ['agendada', 'confirmada', 'rechazada'],
  agendada: ['confirmada'],
  confirmada: [],
  rechazada: [],
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

// Quién puede agendar, confirmar o rechazar una donación:
// - monetaria: solo el titular de la cuenta a la que llegó la transferencia (la Admin también, solo en sus cuentas)
// - insumos: cualquier usuario con sesión (no hay una cuenta a la que se haya transferido)
const verificarPermiso = async (donacion, usuario) => {
  if (donacion.tipo_donacion !== 'monetaria') return;

  const cuenta = donacion.id_cuenta
    ? await prisma.cuenta_transferencia.findUnique({ where: { id_cuenta: donacion.id_cuenta } })
    : null;

  if (cuenta?.rut_usuario !== usuario.rut) {
    throw new HttpError(403, 'Solo el titular de la cuenta puede gestionar esta donación');
  }
};

// Al confirmar una monetaria web hay que subir la captura de la transferencia vista desde la cuenta que la recibió.
// Las presenciales y las de insumos se confirman en persona: no llevan captura
const verificarCapturaConfirmacion = (donacion, archivo) => {
  const esMonetariaWeb = donacion.tipo_donacion === 'monetaria' && donacion.origen === 'web';
  if (esMonetariaWeb && !archivo) throw new HttpError(400, 'Adjunta la captura de la transferencia recibida (JPG o PNG)');
  if (!esMonetariaWeb && archivo) throw new HttpError(400, 'La captura solo aplica a donaciones monetarias hechas por la web');
};

// El correo no se espera: si Gmail falla, la confirmación igual queda guardada
const avisarAlDonante = (donacion) => {
  if (!donacion.donante_correo) return;
  sendDonacionConfirmadaNotification(donacion).catch((error) => {
    console.error(`No se pudo enviar el correo de confirmación de la donación ${donacion.id_donacion}:`, error);
  });
};

const filasDeInsumo = (insumos, id_donacion, rut_usuario) =>
  insumos.map((insumo) => ({ ...insumo, id_donacion, rut_usuario, fecha_ingreso: new Date() }));

// El comprobante va solo con transferencia: es obligatorio ahí y no se acepta en efectivo ni en insumos
const verificarComprobantePresencial = (datos, archivo) => {
  const conTransferencia = datos.tipo_donacion === 'monetaria' && datos.metodo_pago === 'transferencia';
  if (conTransferencia && !archivo) throw new HttpError(400, 'Adjunta el comprobante de la transferencia (JPG o PNG)');
  if (!conTransferencia && archivo) throw new HttpError(400, 'El comprobante solo aplica a transferencias');
};

// Registro presencial: ya está recibida, así que nace confirmada. archivo = req.file de multer (o undefined)
export const createDonacionPresencial = async ({ insumos, ...datos }, usuario, archivo) => {
  verificarInsumos(datos.tipo_donacion, insumos);
  verificarComprobantePresencial(datos, archivo);
  const fecha = datos.fecha_donacion ?? new Date();

  // El archivo se guarda cuando todo lo demás ya pasó las validaciones
  const comprobante_url = archivo ? await guardarComprobante(archivo) : undefined;

  try {
    // Transacción: o se guarda la donación Y sus insumos, o no se guarda nada
    return await prisma.$transaction(async (tx) => {
      const { id_donacion } = await tx.donaciones.create({
        data: {
          ...datos,
          comprobante_url,
          rut_usuario: usuario.rut,
          origen: 'presencial',
          estado: 'confirmada',
          fecha_donacion: fecha,
          fecha_confirmacion: fecha,
        },
      });
      if (insumos) await tx.insumo.createMany({ data: filasDeInsumo(insumos, id_donacion, usuario.rut) });
      return tx.donaciones.findUnique({ where: { id_donacion }, include: incluir });
    });
  } catch (error) {
    // si la base de datos falla, no se deja un archivo huérfano en disco
    if (comprobante_url) await borrarComprobante(comprobante_url);
    throw error;
  }
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

export const getComprobanteConfirmacion = async (id) => {
  const donacion = await obtenerDonacion(id);
  if (!donacion.comprobante_confirmacion_url) throw new HttpError(404, 'Esta donación no tiene captura de confirmación');
  return rutaComprobante(donacion.comprobante_confirmacion_url);
};

// Si tenía comprobante, también se borra el archivo. Los insumos ya recibidos quedan en el inventario
export const deleteDonacion = async (id_donacion) => {
  const donacion = await obtenerDonacion(id_donacion);
  await prisma.donaciones.delete({ where: { id_donacion } });
  if (donacion.comprobante_url) await borrarComprobante(donacion.comprobante_url);
  if (donacion.comprobante_confirmacion_url) await borrarComprobante(donacion.comprobante_confirmacion_url);
};

export const getAllDonaciones = ({ fecha_desde, fecha_hasta, categoria_insumo, ...filtros } = {}) => {
  const where = { ...filtros };

  // rango sobre la fecha en que se recibió o registró la donación
  if (fecha_desde || fecha_hasta) {
    where.fecha_donacion = {
      ...(fecha_desde && { gte: fecha_desde }),
      ...(fecha_hasta && { lte: fecha_hasta }),
    };
  }

  // "alguna de sus filas de insumo es de esa categoría" (las monetarias no tienen filas, así que quedan fuera)
  if (categoria_insumo) where.insumos = { some: { tipo_insumo: categoria_insumo } };

  return prisma.donaciones.findMany({
    where,
    orderBy: { fecha_donacion: 'desc' },
    include: incluir,
  });
};

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
  if (donacion.tipo_donacion !== 'insumos') {
    throw new HttpError(409, 'Solo las donaciones de insumos se pueden agendar');
  }
  verificarTransicion(donacion.estado, 'agendada');
  return prisma.donaciones.update({
    where: { id_donacion: id },
    data: { estado: 'agendada', fecha_agendada },
    include: incluir,
  });
};

// archivo = req.file de multer: la captura que sube el voluntario (solo monetarias web)
export const confirmarDonacion = async (id, { insumos }, usuario, archivo) => {
  const donacion = await obtenerDonacion(id);
  verificarTransicion(donacion.estado, 'confirmada');
  await verificarPermiso(donacion, usuario);
  verificarInsumos(donacion.tipo_donacion, insumos);
  verificarCapturaConfirmacion(donacion, archivo);

  // El archivo se guarda cuando todo lo demás ya pasó las validaciones
  const comprobante_confirmacion_url = archivo ? await guardarComprobante(archivo) : undefined;

  let confirmada;
  try {
    confirmada = await prisma.$transaction(async (tx) => {
      // El "where estado" evita doble confirmación: si dos voluntarios confirman a la vez,
      // solo uno actualiza una fila y el otro recibe 409 (así no se duplican los insumos)
      const { count } = await tx.donaciones.updateMany({
        where: { id_donacion: id, estado: donacion.estado },
        data: {
          estado: 'confirmada',
          fecha_confirmacion: new Date(),
          rut_usuario: usuario.rut,
          comprobante_confirmacion_url,
        },
      });
      if (count === 0) throw new HttpError(409, 'La donación cambió de estado, actualiza e inténtalo de nuevo');

      if (insumos) await tx.insumo.createMany({ data: filasDeInsumo(insumos, id, usuario.rut) });
      return tx.donaciones.findUnique({ where: { id_donacion: id }, include: incluir });
    });
  } catch (error) {
    // si la base de datos falla, no se deja un archivo huérfano en disco
    if (comprobante_confirmacion_url) await borrarComprobante(comprobante_confirmacion_url);
    throw error;
  }

  // Solo las monetarias web avisan por correo: las presenciales y las de insumos se confirman en persona
  if (confirmada.tipo_donacion === 'monetaria' && confirmada.origen === 'web') avisarAlDonante(confirmada);
  return confirmada;
};

// Solo las donaciones monetarias pendientes se pueden rechazar.
export const rechazarDonacion = async (id, usuario) => {
  const donacion = await obtenerDonacion(id);
  if (donacion.tipo_donacion !== 'monetaria') {
    throw new HttpError(409, 'Solo las donaciones monetarias se pueden rechazar');
  }
  verificarTransicion(donacion.estado, 'rechazada');
  await verificarPermiso(donacion, usuario);

  // El "where estado" evita que dos voluntarios actúen a la vez (uno confirma y el otro rechaza)
  const { count } = await prisma.donaciones.updateMany({
    where: { id_donacion: id, estado: donacion.estado },
    data: { estado: 'rechazada' },
  });
  if (count === 0) throw new HttpError(409, 'La donación cambió de estado, actualiza e inténtalo de nuevo');

  return prisma.donaciones.findUnique({ where: { id_donacion: id }, include: incluir });
};

// ---------- Estadísticas ----------
const TOP_DONANTES = 5;

const sinTildes = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// Un donante se identifica por su correo; si no dejó correo, por su nombre.
// Sin ninguno de los dos es anónimo y no entra a los rankings
const claveDonante = (donacion) => {
  if (donacion.donante_correo) return `correo:${donacion.donante_correo.trim().toLowerCase()}`;
  if (donacion.donante_nombre) return `nombre:${sinTildes(donacion.donante_nombre)}`;
  return null;
};

export const getEstadisticas = async () => {
  // solo cuentan las confirmadas: las pendientes todavía no se sabe si llegaron
  const donaciones = await prisma.donaciones.findMany({
    where: { estado: 'confirmada' },
    select: { tipo_donacion: true, monto_donacion: true, donante_nombre: true, donante_correo: true },
    orderBy: { fecha_donacion: 'asc' },
  });

  const donantes = new Map();
  for (const donacion of donaciones) {
    const clave = claveDonante(donacion);
    if (!clave) continue;

    const donante = donantes.get(clave) ?? { nombre: 'Sin nombre', total: 0, cantidad: 0 };
    // van de la más antigua a la más reciente: queda el nombre con que donó la última vez
    if (donacion.donante_nombre) donante.nombre = donacion.donante_nombre;
    donante.cantidad += 1;
    if (donacion.tipo_donacion === 'monetaria') donante.total += donacion.monto_donacion ?? 0;
    donantes.set(clave, donante);
  }

  const lista = [...donantes.values()];
  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es');

  // por monto: solo quienes donaron dinero; por cantidad: todos (monetarias e insumos)
  const porMonto = lista
    .filter((donante) => donante.total > 0)
    .sort((a, b) => b.total - a.total || b.cantidad - a.cantidad || porNombre(a, b))
    .slice(0, TOP_DONANTES);
  const porCantidad = [...lista]
    .sort((a, b) => b.cantidad - a.cantidad || b.total - a.total || porNombre(a, b))
    .slice(0, TOP_DONANTES);

  return { porMonto, porCantidad };
};