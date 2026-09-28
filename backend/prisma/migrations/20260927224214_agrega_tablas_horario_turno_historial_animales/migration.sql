-- CreateTable
CREATE TABLE "Horario" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "rut_usuario" TEXT NOT NULL,
    "horario_id" INTEGER NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("rut_usuario","horario_id")
);

-- CreateTable
CREATE TABLE "hitorial_medico" (
    "id_historial" SERIAL NOT NULL,
    "nombre" VARCHAR(100),
    "tratamiento" VARCHAR(500) NOT NULL,
    "fecha_tratamiento" TIMESTAMP(3) NOT NULL,
    "veterinario" VARCHAR(100) NOT NULL,
    "observaciones" VARCHAR(500),
    "id_animal" INTEGER NOT NULL,

    CONSTRAINT "hitorial_medico_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "animales" (
    "id_animal" SERIAL NOT NULL,
    "edad" INTEGER NOT NULL,
    "via_ingreso" VARCHAR(100) NOT NULL,
    "peso_animal" INTEGER NOT NULL,
    "especie_animal" VARCHAR(100) NOT NULL,
    "observaciones_animal" TEXT,

    CONSTRAINT "animales_pkey" PRIMARY KEY ("id_animal")
);

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "Horario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hitorial_medico" ADD CONSTRAINT "hitorial_medico_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;
