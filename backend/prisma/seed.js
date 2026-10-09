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
    // horario estatico: el id identifica el dia de la semana (1 = Lunes ... 7 = Domingo)
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    for (const [i, dia] of dias.entries()) {
        await prisma.horario.upsert({
            where: { id: i + 1 },
            update: { dia },
            create: { id: i + 1, dia },
        });
    }
    console.log(`Horarios creados: ${dias.length}`);

        // la contraseña se hashea una sola vez, el 10 son las rondas de salt (igual que en el login)
    const contrasenaHash = await bcrypt.hash(PASSWORD_DE_PRUEBA, 10);
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

    console.log('-Creando turnos');
    // bloques de una hora entre las 08:00 y las 20:00, ej: 8 -> "08:00"
    const hora = (h) => `${String(h).padStart(2, '0')}:00`;
    const turnos = [];
    for (const rut_usuario of rutUsuarios) {
        for (let horario_id = 1; horario_id <= dias.length; horario_id++) {
            // cada usuario tiene turno mas o menos la mitad de los dias
            if (!faker.datatype.boolean()) continue;

            const inicio = faker.number.int({ min: 8, max: 17 });
            turnos.push({
                rut_usuario,
                horario_id,
                hora_inicio: hora(inicio),
                // a veces se registra solo la llegada (hora_fin null)
                hora_fin: faker.datatype.boolean() ? hora(inicio + faker.number.int({ min: 1, max: 3 })) : null,
            });
        }
    }
    const resultadoTurnos = await prisma.turno.createMany({ data: turnos });
    console.log(`Turnos creados: ${resultadoTurnos.count}`);

    console.log('-Creando insumos');
    const fechaBase = new Date();
    const fechaRelativa = (dias) => {
        const fecha = new Date(fechaBase);
        fecha.setUTCDate(fecha.getUTCDate() + dias);
        return fecha;
    };
    const insumos = [
        { tipo_insumo: 'Alimento seco para perros', dias_ingreso: -6, dias_vencimiento: 266, descripcion: 'Sacos de 15 kg para alimentación diaria de perros adultos', cantidad: 8, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Alimento seco para gatos', dias_ingreso: -5, dias_vencimiento: 236, descripcion: 'Sacos de 10 kg para gatos adultos', cantidad: 5, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Alimento húmedo para perros', dias_ingreso: -4, dias_vencimiento: 175, descripcion: 'Latas de 400 g para animales en recuperación o con dieta especial', cantidad: 36, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Arena sanitaria para gatos', dias_ingreso: -6, dias_vencimiento: null, descripcion: 'Bolsas de 10 kg para bandejas sanitarias', cantidad: 12, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Gasas estériles', dias_ingreso: -7, dias_vencimiento: 1090, descripcion: 'Paquetes de 100 unidades para curaciones bajo supervisión veterinaria', cantidad: 10, rut_usuario: '44444444-4' },
        { tipo_insumo: 'Guantes de nitrilo', dias_ingreso: -7, dias_vencimiento: null, descripcion: 'Cajas de 100 unidades, talla mixta, para manejo e higiene', cantidad: 14, rut_usuario: '44444444-4' },
        { tipo_insumo: 'Suero fisiológico', dias_ingreso: -5, dias_vencimiento: 725, descripcion: 'Frascos de 500 ml para uso veterinario según indicación profesional', cantidad: 20, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Desinfectante de superficies', dias_ingreso: -6, dias_vencimiento: 725, descripcion: 'Bidones de 5 litros para limpieza de caniles y áreas comunes', cantidad: 6, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Limpiador enzimático', dias_ingreso: -4, dias_vencimiento: 570, descripcion: 'Botellas de 1 litro para eliminar olores en espacios de animales', cantidad: 9, rut_usuario: '44444444-4' },
        { tipo_insumo: 'Bolsas para residuos', dias_ingreso: -7, dias_vencimiento: null, descripcion: 'Rollos de 20 bolsas resistentes para limpieza diaria', cantidad: 25, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Correas para paseo', dias_ingreso: -5, dias_vencimiento: null, descripcion: 'Unidades de 1.5 m para paseos supervisados', cantidad: 10, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Toallas absorbentes', dias_ingreso: -6, dias_vencimiento: null, descripcion: 'Paquetes de 10 unidades para limpieza y cuidado de animales', cantidad: 7, rut_usuario: '44444444-4' },
    ].map(({ dias_ingreso, dias_vencimiento, ...insumo }) => ({
        ...insumo,
        fecha_ingreso: fechaRelativa(dias_ingreso),
        fecha_vencimiento: dias_vencimiento === null ? null : fechaRelativa(dias_vencimiento),
    }));
    const resultadoInsumos = await prisma.insumo.createMany({ data: insumos });
    console.log(`Insumos creados: ${resultadoInsumos.count}`);

}
main()
    .catch((e) => {
        console.error(e);
        process.exit(1); //si algo falla, el comando termina con codigo de error y no aparenta que todo salio bien
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
