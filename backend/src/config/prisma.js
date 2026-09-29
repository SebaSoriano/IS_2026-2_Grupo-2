//Archivo que crea la instancia de PrismaClient que los "services" importan
//mientras el servidor corre, para que no se creen múltiples instancias de PrismaClient y 
//se generen errores de conexión a la base de datos.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;