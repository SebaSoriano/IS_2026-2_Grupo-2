import prisma from '../config/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { ROLES } from '../config/roles.js';

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

// Todos los roles ven todas las cuentas: es la misma información que muestra el formulario público
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

const DATOS_BANCARIOS = ['banco', 'tipo_cuenta', 'numero_cuenta', 'titular_nombre', 'titular_rut', 'correo'];

export const updateCuenta = async (id_cuenta, datos, usuario) => {
  const cuenta = await prisma.cuenta_transferencia.findUnique({
    where: { id_cuenta },
    include: { _count: { select: { donaciones: true } } },
  });
  if (!cuenta) throw new HttpError(404, 'Cuenta no encontrada');

  const esAdmin = usuario.rol === ROLES.ADMIN;
  if (!esAdmin && cuenta.rut_usuario !== usuario.rut) {
    throw new HttpError(403, 'Solo puedes modificar la cuenta que está a tu nombre');
  }
  if (!esAdmin && !cuenta.activa) {
    throw new HttpError(409, 'Esta cuenta ya no está activa');
  }

  // Solo importa cuando se está desactivando una cuenta que hoy está activa
  if (datos.activa === false && cuenta.activa) {
    await verificarQueQuedeOtraActiva(id_cuenta);
  }

  const cambiaDatosBancarios = DATOS_BANCARIOS.some(
    (campo) => datos[campo] !== undefined && datos[campo] !== cuenta[campo],
  );

  // Si la cuenta ya recibió donaciones, no se pisan sus datos: esas donaciones deben seguir mostrando
  // el banco al que llegaron. Se desactiva la antigua y se crea una nueva con los datos cambiados.
  if (cambiaDatosBancarios && cuenta.activa && cuenta._count.donaciones > 0) {
    const datosActuales = Object.fromEntries(DATOS_BANCARIOS.map((campo) => [campo, cuenta[campo]]));

    return prisma.$transaction(async (tx) => {
      await tx.cuenta_transferencia.update({ where: { id_cuenta }, data: { activa: false } });
      return tx.cuenta_transferencia.create({
        data: { ...datosActuales, rut_usuario: cuenta.rut_usuario, ...datos, activa: datos.activa ?? true },
      });
    });
  }

  return prisma.cuenta_transferencia.update({ where: { id_cuenta }, data: datos });
};

// Si la cuenta nunca recibió donaciones, se borra.
// Si ya tiene, no se puede borrar (la FK de donaciones es RESTRICT y se perdería el historial),
// así que se desactiva: deja de aparecer en el formulario público, pero las donaciones siguen apuntando a ella.
export const eliminarCuenta = async (id_cuenta) => {
  const cuenta = await prisma.cuenta_transferencia.findUnique({
    where: { id_cuenta },
    include: { _count: { select: { donaciones: true } } },
  });
  if (!cuenta) throw new HttpError(404, 'Cuenta no encontrada');

  // regla del sistema: siempre debe quedar al menos una cuenta activa
  if (cuenta.activa) await verificarQueQuedeOtraActiva(id_cuenta);

  if (cuenta._count.donaciones > 0) {
    await prisma.cuenta_transferencia.update({ where: { id_cuenta }, data: { activa: false } });
    return { resultado: 'desactivada' };
  }

  await prisma.cuenta_transferencia.delete({ where: { id_cuenta } });
  return { resultado: 'eliminada' };
};