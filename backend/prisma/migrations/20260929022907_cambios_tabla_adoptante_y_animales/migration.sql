/*
  Warnings:

  - Added the required column `nombre_adoptante` to the `adoptante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_animal` to the `animales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "adoptante" ADD COLUMN     "nombre_adoptante" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "animales" ADD COLUMN     "nombre_animal" TEXT NOT NULL;
