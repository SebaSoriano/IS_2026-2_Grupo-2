/*
  Warnings:

  - Added the required column `tipo_vivienda` to the `adoptante` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoVivienda" AS ENUM ('casa', 'departamento');

-- 1) Se agrega la columna SIN "NOT NULL", para que no falle con los adoptantes que ya existen
ALTER TABLE "adoptante" ADD COLUMN "tipo_vivienda" "TipoVivienda";

-- 2) A los adoptantes antiguos se les pone 'casa' de forma provisoria
UPDATE "adoptante" SET "tipo_vivienda" = 'casa' WHERE "tipo_vivienda" IS NULL;

-- 3) Ahora que ninguna fila está vacía, la columna pasa a ser obligatoria
ALTER TABLE "adoptante" ALTER COLUMN "tipo_vivienda" SET NOT NULL;