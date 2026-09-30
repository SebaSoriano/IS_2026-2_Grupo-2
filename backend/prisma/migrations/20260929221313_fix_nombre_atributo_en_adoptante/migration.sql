/*
  Warnings:

  - You are about to drop the column `fecha_naciciento` on the `adoptante` table. All the data in the column will be lost.
  - Added the required column `fecha_nacimiento` to the `adoptante` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "adoptante" DROP COLUMN "fecha_naciciento",
ADD COLUMN     "fecha_nacimiento" TIMESTAMP(3) NOT NULL;
