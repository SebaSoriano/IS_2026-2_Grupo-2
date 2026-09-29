// services/insumo.service.js

//este import hace que se ocupe una sola instancia
import prisma from '../config/prisma.js';


//listar todos los insumos
export async function getAllInsumos() {
 return prisma.insumo.findMany({
   include: {
    usuario: {
        // select explicito para no traer la contraseña y demas campos del usuario, solamente traermos el rut y el correo
        // de quien registro el insumo
        select: {rut_usuario: true, correo: true},
     },  
    },    
 });
}