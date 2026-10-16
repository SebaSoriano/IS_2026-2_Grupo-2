
-- CreateEnum
CREATE TYPE "TipoDonacion" AS ENUM ('monetaria', 'insumos');
CREATE TYPE "OrigenDonacion" AS ENUM ('presencial', 'web');
CREATE TYPE "EstadoDonacion" AS ENUM ('pendiente', 'agendada', 'confirmada');
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'transferencia');

-- tipo_donacion: de texto a enum conservando los datos existentes
ALTER TABLE "donaciones"
  ALTER COLUMN "tipo_donacion" TYPE "TipoDonacion"
  USING (CASE WHEN "tipo_donacion" = 'dinero' THEN 'monetaria' ELSE 'insumos' END)::"TipoDonacion";

-- Columnas nuevas. Las filas antiguas se rellenan con un DEFAULT temporal
-- (presencial + confirmada), que se quita justo después porque el schema no lo define.
ALTER TABLE "donaciones"
  ADD COLUMN "origen" "OrigenDonacion" NOT NULL DEFAULT 'presencial',
  ADD COLUMN "estado" "EstadoDonacion" NOT NULL DEFAULT 'confirmada',
  ADD COLUMN "metodo_pago" "MetodoPago",
  ADD COLUMN "comprobante_url" VARCHAR(255),
  ADD COLUMN "descripcion_insumos" VARCHAR(500),
  ADD COLUMN "fecha_agendada" TIMESTAMP(3),
  ADD COLUMN "fecha_confirmacion" TIMESTAMP(3),
  ADD COLUMN "donante_nombre" VARCHAR(100),
  ADD COLUMN "donante_correo" VARCHAR(100),
  ADD COLUMN "donante_telefono" VARCHAR(15);

ALTER TABLE "donaciones" ALTER COLUMN "origen" DROP DEFAULT;
ALTER TABLE "donaciones" ALTER COLUMN "estado" DROP DEFAULT;

-- Las donaciones antiguas ya estaban recibidas: su confirmación es su fecha
UPDATE "donaciones" SET "fecha_confirmacion" = "fecha_donacion";

-- rut_usuario pasa a ser opcional (donaciones web aún sin voluntario asignado)
ALTER TABLE "donaciones" ALTER COLUMN "rut_usuario" DROP NOT NULL;

-- Insumo: referencia opcional a la donación de la que proviene
ALTER TABLE "Insumo" ADD COLUMN "id_donacion" INTEGER;

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_id_donacion_fkey"
  FOREIGN KEY ("id_donacion") REFERENCES "donaciones"("id_donacion")
  ON DELETE SET NULL ON UPDATE CASCADE;