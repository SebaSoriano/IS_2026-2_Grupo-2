/*
  Warnings:

  - Made the column `sexo_animal` on table `animales` required. This step will fail if there are existing NULL values in that column.

*/
-- Los animales que ya existían no tenían sexo: se les pone 'macho' de forma provisoria
-- para poder volver la columna obligatoria (después se corrige el valor real de cada uno)
UPDATE "animales" SET "sexo_animal" = 'macho' WHERE "sexo_animal" IS NULL;

-- AlterTable
ALTER TABLE "animales" ALTER COLUMN "sexo_animal" SET NOT NULL;