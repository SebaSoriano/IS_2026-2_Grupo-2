/*
 semilla para rellenar de datos la base de datos usando Faker
*/
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';


// nueva instancia del cliente de prisma, la otra vive aparte en src/config/prisma.js
const prisma = new PrismaClient();

async function main() {
    console.log('Poblacion de datos iniciada \n -Limpiando datos anteriores.');
    await prisma.turno.deleteMany();
    await prisma.adopciones.deleteMany();
    await prisma.donaciones.deleteMany();
    await prisma.historial_medico.deleteMany();
    await prisma.agendamiento.deleteMany();
    await prisma.horario.deleteMany();
    await prisma.insumo.deleteMany();
    await prisma.animales.deleteMany();
    await prisma.adoptante.deleteMany();
    await prisma.usuario.deleteMany();
}