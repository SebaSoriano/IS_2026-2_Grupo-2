-- CreateEnum
CREATE TYPE "EstadoAnimal" AS ENUM ('disponible', 'en_proceso', 'adoptado', 'fallecido');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'en_proceso', 'rechazada', 'adoptada');

-- AlterTable
ALTER TABLE "adoptante" ADD COLUMN     "nombre_adoptante" VARCHAR(100);

-- AlterTable
ALTER TABLE "animales" ADD COLUMN     "estado_animal" "EstadoAnimal" NOT NULL DEFAULT 'disponible';

-- CreateTable
CREATE TABLE "solicitudes_adopcion" (
    "id_solicitud" SERIAL NOT NULL,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "fecha_visita" TIMESTAMP(3),
    "id_animal" INTEGER NOT NULL,
    "id_adoptante" INTEGER NOT NULL,

    CONSTRAINT "solicitudes_adopcion_pkey" PRIMARY KEY ("id_solicitud")
);

-- AddForeignKey
ALTER TABLE "solicitudes_adopcion" ADD CONSTRAINT "solicitudes_adopcion_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_adopcion" ADD CONSTRAINT "solicitudes_adopcion_id_adoptante_fkey" FOREIGN KEY ("id_adoptante") REFERENCES "adoptante"("id_adoptante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Los animales que ya tienen una adopción guardada quedan como "adoptado"
UPDATE "animales" SET "estado_animal" = 'adoptado'
WHERE "id_animal" IN (SELECT "id_animal" FROM "adopciones");

-- Antes el nombre del adoptante se guardaba dentro de las observaciones ("Nombre: Carla | Tiene patio").
-- Se pasa a su columna nueva y se deja en las observaciones solo lo que venía después de " | "
UPDATE "adoptante"
SET "nombre_adoptante" = split_part(substring("observaciones_adoptante" from 9), ' | ', 1),
    "observaciones_adoptante" = CASE
        WHEN position(' | ' in "observaciones_adoptante") > 0
            THEN substring("observaciones_adoptante" from position(' | ' in "observaciones_adoptante") + 3)
        ELSE NULL
    END
WHERE "observaciones_adoptante" LIKE 'Nombre: %';