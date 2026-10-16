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
    // los turnos son de una fecha puntual: se crean desde 3 semanas atras hasta 3 semanas adelante
    const hoy = new Date();
    const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const UN_DIA = 24 * 60 * 60 * 1000;
    const turnos = [];
    for (let dia = -21; dia <= 21; dia++) {
        const fecha = new Date(hoyUTC + dia * UN_DIA);
        // horario_id es el dia de la semana de la fecha (1 = Lunes ... 7 = Domingo)
        const horario_id = fecha.getUTCDay() || 7;
        for (const rut_usuario of rutUsuarios) {
            // cada usuario se anota mas o menos un tercio de los dias
            if (faker.number.int({ min: 1, max: 3 }) !== 1) continue;

            // a veces se anota en dos turnos el mismo dia (uno en la mañana y otro en la tarde, sin cruzarse)
            const bloques = faker.datatype.boolean({ probability: 0.25 })
                ? [faker.number.int({ min: 8, max: 10 }), faker.number.int({ min: 14, max: 17 })]
                : [faker.number.int({ min: 8, max: 17 })];

            for (const inicio of bloques) {
                turnos.push({
                    rut_usuario,
                    fecha,
                    horario_id,
                    hora_inicio: hora(inicio),
                    // a veces se registra solo la llegada (hora_fin null)
                    hora_fin: faker.datatype.boolean() ? hora(inicio + faker.number.int({ min: 1, max: 2 })) : null,
                    // solo los turnos que ya pasaron pueden tener asistencia
                    llego_a_la_hora: dia <= 0 && faker.datatype.boolean({ probability: 0.7 }),
                });
            }
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
        { tipo_insumo: 'Alimentación', dias_ingreso: -6, dias_vencimiento: 266, descripcion: 'Alimento seco para perros adultos en sacos de 15 kg', cantidad: 8, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Alimentación', dias_ingreso: -5, dias_vencimiento: 236, descripcion: 'Alimento seco para gatos adultos en sacos de 10 kg', cantidad: 5, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Alimentación', dias_ingreso: -4, dias_vencimiento: 175, descripcion: 'Alimento húmedo para perros en latas de 400 g, para recuperación o dietas especiales', cantidad: 36, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Higiene y aseo', dias_ingreso: -6, dias_vencimiento: null, descripcion: 'Arena sanitaria para gatos en bolsas de 10 kg', cantidad: 12, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Salud', dias_ingreso: -7, dias_vencimiento: 1090, descripcion: 'Gasas estériles en paquetes de 100 unidades para curaciones bajo supervisión veterinaria', cantidad: 10, rut_usuario: '44444444-4' },
        { tipo_insumo: 'Higiene y aseo', dias_ingreso: -7, dias_vencimiento: null, descripcion: 'Guantes de nitrilo en cajas de 100 unidades para manejo e higiene', cantidad: 14, rut_usuario: '44444444-4' },
        { tipo_insumo: 'Salud', dias_ingreso: -5, dias_vencimiento: 725, descripcion: 'Suero fisiológico en frascos de 500 ml para uso veterinario según indicación profesional', cantidad: 20, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Limpieza', dias_ingreso: -6, dias_vencimiento: 725, descripcion: 'Desinfectante de superficies en bidones de 5 litros para caniles y áreas comunes', cantidad: 6, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Limpieza', dias_ingreso: -4, dias_vencimiento: 570, descripcion: 'Limpiador enzimático en botellas de 1 litro para eliminar olores en espacios de animales', cantidad: 9, rut_usuario: '44444444-4' },
        { tipo_insumo: 'Limpieza', dias_ingreso: -7, dias_vencimiento: null, descripcion: 'Bolsas resistentes para residuos en rollos de 20 unidades', cantidad: 25, rut_usuario: '12123123-2' },
        { tipo_insumo: 'Accesorios y juguetes', dias_ingreso: -5, dias_vencimiento: null, descripcion: 'Correas de 1.5 m para paseos supervisados', cantidad: 10, rut_usuario: '22222222-2' },
        { tipo_insumo: 'Limpieza', dias_ingreso: -6, dias_vencimiento: null, descripcion: 'Toallas absorbentes en paquetes de 10 unidades para limpieza y cuidado de animales', cantidad: 7, rut_usuario: '44444444-4' },
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
