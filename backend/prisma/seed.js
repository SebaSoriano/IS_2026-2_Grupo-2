/*
 semilla para rellenar de datos la base de datos usando Faker
*/
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
// bcrypt para guardar las contraseñas hasheadas igual que las compara el login
import bcrypt from 'bcryptjs';


// nueva instancia del cliente de prisma, la otra vive aparte en src/config/prisma.js
const prisma = new PrismaClient();
// contraseña de prueba, SOLO para desarrollo
// todos los usuarios del seed usan esta misma contraseña (el rut del admin es el primero de rutUsuarios)
const PASSWORD_DE_PRUEBA = 'admin1234';

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

    
    const rutUsuarios = ['11111111-1', '22222222-2', '12123123-2', '44444444-4'];


    const roles = [
        { id: 1, nombre: 'Admin' },
        { id: 2, nombre: 'Veterinaria' },
        { id: 3, nombre: 'Voluntario' },
    ];
    
    console.log('-Creando roles');
    for (const rol of roles) {
        await prisma.rol.upsert({
            where: { id: rol.id },
            update: { nombre: rol.nombre },
            create: rol,
        });
    }

    console.log('-Creando horarios');
        // la contraseña se hashea una sola vez, el 10 son las rondas de salt (igual que en el login)
    const contrasenaHash = await bcrypt.hash(PASSWORD_DE_PRUEBA, 10);
    const horarios = await Promise.all(
      [1, 2, 3].map((dias) =>
        prisma.horario.create({
          data: { fecha: faker.date.soon({ days: 7 * dias }) },
        })
      )
    );

console.log(`Horarios creados: ${horarios.length}`);
    console.log('-Creando usuarios');
    const usuarios = await Promise.all(
        rutUsuarios.map((rut_usuario, i) => {
            const nombre = faker.person.firstName();
            const apellido = faker.person.lastName();

            return prisma.usuario.create({
                data: {
                    rut_usuario,
                    rol_id: i === 0 ? 1 : 3,
                    nombre_usuario: `${nombre} ${apellido}`,
                    correo: faker.internet.email({ firstName: nombre, lastName: apellido }),
                    telefono: '9' + faker.string.numeric(8),
                    contrasena: contrasenaHash,
                    fecha_nacimiento: faker.date.birthdate({ min: 15, max: 65, mode: 'age' }),
                },
            });
        })
    );

    console.log(`Usuarios creados: ${usuarios.length}`);
    console.log(`Para iniciar sesión usa el rut ${rutUsuarios[0]} (Admin) y la contraseña ${PASSWORD_DE_PRUEBA}`);

}
main()
    .catch((e) => {
        console.error(e);
        process.exit(1); //si algo falla, el comando termina con codigo de error y no aparenta que todo salio bien
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
