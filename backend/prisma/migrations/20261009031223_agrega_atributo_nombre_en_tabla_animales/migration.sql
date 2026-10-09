/*
  Warnings:

  - Added the required column `nombre_animal` to the `animales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "animales" ADD COLUMN     "nombre_animal" VARCHAR(100) NOT NULL;
