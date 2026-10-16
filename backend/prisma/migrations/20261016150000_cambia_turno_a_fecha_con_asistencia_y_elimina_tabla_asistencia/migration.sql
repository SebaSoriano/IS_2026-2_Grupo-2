/*
  Los turnos pasan a ser de una fecha puntual y guardan su propia asistencia (llego_a_la_hora).
  Los turnos anteriores no tienen fecha, por eso se borran antes de agregar la columna obligatoria
  (son datos de prueba, se vuelven a crear con el seed).
  La tabla Asistencia se elimina porque la asistencia ahora es parte del turno.
*/
-- DeleteData
DELETE FROM "Turno";

-- DropForeignKey
ALTER TABLE "Asistencia" DROP CONSTRAINT "Asistencia_rut_usuario_fkey";

-- DropIndex
DROP INDEX "Turno_rut_usuario_horario_id_hora_inicio_key";

-- AlterTable
ALTER TABLE "Turno" ADD COLUMN     "fecha" DATE NOT NULL,
ADD COLUMN     "llego_a_la_hora" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Asistencia";

-- CreateIndex
CREATE UNIQUE INDEX "Turno_rut_usuario_fecha_hora_inicio_key" ON "Turno"("rut_usuario", "fecha", "hora_inicio");
