// services/insumo.service.js

//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';

// estandarizacion de lo que se mostrar publicamente del usuario, esto para evitar volver a escribir las mismas lineas de codigo
// nunca incluir la contrasena
const usuarioPublico = {
  select: { rut_usuario: true, correo: true },
};

//obtener todos los insumos incluyendo el usuario que registro el insumo
export async function getAllInsumos() {
  return prisma.insumo.findMany({
    include: {
      usuario: usuarioPublico,
    },
  });
}

//obtener insumo por id con la informacion del usuario que lo registro
export async function getInsumoById(id) {
  return prisma.insumo.findUnique({
    where: {id},
    include:{
      usuario: usuarioPublico,
     },
  });
}

