/*
  Warnings:

  - You are about to drop the column `fecha` on the `Horario` table. All the data in the column will be lost.
  - The primary key for the `Turno` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[dia]` on the table `Horario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rut_usuario,horario_id,hora_inicio]` on the table `Turno` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dia` to the `Horario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora_inicio` to the `Turno` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Horario" DROP COLUMN "fecha",
ADD COLUMN     "dia" VARCHAR(20) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Horario_id_seq";

-- AlterTable
ALTER TABLE "Turno" DROP CONSTRAINT "Turno_pkey",
ADD COLUMN     "hora_fin" VARCHAR(5),
ADD COLUMN     "hora_inicio" VARCHAR(5) NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Turno_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Horario_dia_key" ON "Horario"("dia");

-- CreateIndex
CREATE UNIQUE INDEX "Turno_rut_usuario_horario_id_hora_inicio_key" ON "Turno"("rut_usuario", "horario_id", "hora_inicio");
