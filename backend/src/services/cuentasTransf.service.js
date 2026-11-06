import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';

// Lo único que ve el público: lo necesario para transferir, sin el rut del voluntario administrador
const datosPublicos = {
  id_cuenta: true,
  banco: true,
  tipo_cuenta: true,
  numero_cuenta: true,
  titular_nombre: true,
  titular_rut: true,
  correo: true,
};

export const getCuentasPublicas = () =>
  prisma.cuenta_transferencia.findMany({
    where: { activa: true },
    select: datosPublicos,
    orderBy: { titular_nombre: 'asc' },
  });

export const getAllCuentas = () =>
  prisma.cuenta_transferencia.findMany({
    orderBy: { id_cuenta: 'asc' },
    include: { usuario: { select: { rut_usuario: true, nombre_usuario: true } } },
  });

export const createCuenta = (datos) =>
  prisma.cuenta_transferencia.create({ data: datos });

// Regla del sistema: siempre debe quedar al menos una cuenta activa
const verificarQueQuedeOtraActiva = async (id_cuenta) => {
  const otrasActivas = await prisma.cuenta_transferencia.count({
    where: { activa: true, NOT: { id_cuenta } },
  });
  if (otrasActivas === 0) {
    throw new HttpError(409, 'Debe haber al menos una cuenta activa para recibir donaciones');
  }
};

export const updateCuenta = async (id_cuenta, datos) => {
  const cuenta = await prisma.cuenta_transferencia.findUnique({ where: { id_cuenta } });
  if (!cuenta) throw new HttpError(404, 'Cuenta no encontrada');

  // Solo importa cuando se está desactivando una cuenta que hoy está activa
  if (datos.activa === false && cuenta.activa) {
    await verificarQueQuedeOtraActiva(id_cuenta);
  }

  return prisma.cuenta_transferencia.update({ where: { id_cuenta }, data: datos });
};