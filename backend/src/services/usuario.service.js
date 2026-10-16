//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';
import { usuarioPublico } from './usuario.select.js';
import bcrypt from 'bcryptjs';
import { HttpError } from '../middlewares/error.middleware.js';

// service para obtener un usuario por rut, sin la contrasena
export const obtenerUsuarioPorRut = (rut) => {
    return prisma.usuario.findUnique({
        where: { rut_usuario: rut },
        select: usuarioPublico.select,
    });
};

// service para buscar usuarios cuyo nombre contenga el texto escrito
// mode 'insensitive' hace que no importen las mayusculas ("luk" encuentra a "Lukas")
export const buscarUsuariosPorNombre = (nombre) => {
    return prisma.usuario.findMany({
        where: { nombre_usuario: { contains: nombre, mode: 'insensitive' } },
        select: usuarioPublico.select,
        orderBy: { nombre_usuario: 'asc' },
        take: 10,
    });
};

// Datos que se pueden mostrar de un usuario (NUNCA la contraseña)
const datosVisibles = {
  rut_usuario: true,
  nombre_usuario: true,
  correo: true,
  telefono: true,
  fecha_nacimiento: true,
  rol_id: true,
};

// Listar todos los usuarios (voluntarios y personal), ordenados por nombre
export async function obtenerUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre_usuario: 'asc' },
    select: datosVisibles,
  });
  return usuarios;
}

// Modificar un usuario
export async function actualizarUsuario(rut, datos) {
  // Si viene una contraseña nueva, se encripta antes de guardarla
  if (datos.contrasena !== undefined) {
    datos.contrasena = await bcrypt.hash(datos.contrasena, 10);
  }

  // Si el RUT no existe, Prisma lanza P2025 y error.middleware.js responde 404
  const usuarioModificado = await prisma.usuario.update({
    where: { rut_usuario: rut },
    data: datos,
    select: datosVisibles,
  });

  return usuarioModificado;
}

// Eliminar un usuario
export async function eliminarUsuario(rut) {
  // Buscar y mostrar todo lo que tiene asociado
  const usuario = await prisma.usuario.findUnique({
    where: { rut_usuario: rut },
    include: {
      _count: {
        select: {
          adopciones: true,
          insumos: true,
          turnos: true,
          donaciones: true,
          agendamientos: true,
        },
      },
    },
  });

  // Si no existe, tira error 404
  if (usuario === null) {
    throw new HttpError(404, 'Voluntario no encontrado');
  }

  // Si registró cosas en el sistema, no se puede borrar
  const conteo = usuario._count;
  const totalRegistros =
    conteo.adopciones + conteo.insumos + conteo.turnos + conteo.donaciones + conteo.agendamientos;

  if (totalRegistros > 0) {
    throw new HttpError(
      409,
      'No se puede eliminar un voluntario con registros asociados (adopciones, insumos, turnos, donaciones o agendamientos)',
    );
  }

  // Si pasó todo lo anterior, se elimina
  await prisma.usuario.delete({ where: { rut_usuario: rut } });
}
