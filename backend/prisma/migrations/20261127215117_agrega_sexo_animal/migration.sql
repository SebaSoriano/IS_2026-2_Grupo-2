-- CreateEnum
CREATE TYPE "SexoAnimal" AS ENUM ('macho', 'hembra');

-- AlterTable
ALTER TABLE "animales" ADD COLUMN     "sexo_animal" "SexoAnimal";
