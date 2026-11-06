-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('corriente', 'vista', 'ahorro', 'rut');

-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "id_cuenta" INTEGER;

-- CreateTable
CREATE TABLE "cuenta_transferencia" (
    "id_cuenta" SERIAL NOT NULL,
    "banco" VARCHAR(100) NOT NULL,
    "tipo_cuenta" "TipoCuenta" NOT NULL,
    "numero_cuenta" VARCHAR(20) NOT NULL,
    "titular_nombre" VARCHAR(100) NOT NULL,
    "titular_rut" VARCHAR(12) NOT NULL,
    "correo" VARCHAR(100),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "rut_usuario" TEXT NOT NULL,

    CONSTRAINT "cuenta_transferencia_pkey" PRIMARY KEY ("id_cuenta")
);

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "cuenta_transferencia"("id_cuenta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta_transferencia" ADD CONSTRAINT "cuenta_transferencia_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
