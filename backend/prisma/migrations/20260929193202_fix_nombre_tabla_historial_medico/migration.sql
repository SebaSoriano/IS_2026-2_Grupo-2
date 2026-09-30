/*
  Warnings:

  - You are about to drop the column `nombre_adoptante` on the `adoptante` table. All the data in the column will be lost.
  - You are about to drop the column `nombre_animal` on the `animales` table. All the data in the column will be lost.
  - You are about to drop the `hitorial_medico` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nombre_usuario` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "hitorial_medico" DROP CONSTRAINT "hitorial_medico_id_animal_fkey";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "nombre_usuario" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "adoptante" DROP COLUMN "nombre_adoptante";

-- AlterTable
ALTER TABLE "animales" DROP COLUMN "nombre_animal";

-- DropTable
DROP TABLE "hitorial_medico";

-- CreateTable
CREATE TABLE "historial_medico" (
    "id_historial" SERIAL NOT NULL,
    "nombre" VARCHAR(100),
    "tratamiento" VARCHAR(500) NOT NULL,
    "fecha_tratamiento" TIMESTAMP(3) NOT NULL,
    "veterinario" VARCHAR(100) NOT NULL,
    "observaciones" VARCHAR(500),
    "id_animal" INTEGER NOT NULL,

    CONSTRAINT "historial_medico_pkey" PRIMARY KEY ("id_historial")
);

-- AddForeignKey
ALTER TABLE "historial_medico" ADD CONSTRAINT "historial_medico_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;
