/*
  La asistencia del turno pasa de un booleano (llego_a_la_hora) a la hora en que la persona
  registro su llegada (hora_llegada, "HH:MM"). Si llego a la hora, tarde o no vino se calcula con esa hora.
  Los turnos que estaban marcados como "llego a la hora" quedan con la hora de inicio del turno como llegada.
*/
-- AlterTable
ALTER TABLE "Turno" ADD COLUMN "hora_llegada" VARCHAR(5);

-- MigrateData
UPDATE "Turno" SET "hora_llegada" = "hora_inicio" WHERE "llego_a_la_hora" = true;

-- AlterTable
ALTER TABLE "Turno" DROP COLUMN "llego_a_la_hora";
