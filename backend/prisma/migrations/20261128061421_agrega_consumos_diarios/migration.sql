-- AlterTable
ALTER TABLE "movimiento_insumo" ADD COLUMN     "id_consumo_diario" INTEGER;

-- CreateTable
CREATE TABLE "consumo_diario" (
    "id_consumo_diario" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rut_usuario" TEXT NOT NULL,

    CONSTRAINT "consumo_diario_pkey" PRIMARY KEY ("id_consumo_diario")
);

-- CreateTable
CREATE TABLE "consumo_diario_insumo" (
    "id_consumo_diario" INTEGER NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "cantidad" INTEGER,

    CONSTRAINT "consumo_diario_insumo_pkey" PRIMARY KEY ("id_consumo_diario","id_insumo")
);

-- AddForeignKey
ALTER TABLE "consumo_diario" ADD CONSTRAINT "consumo_diario_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_diario_insumo" ADD CONSTRAINT "consumo_diario_insumo_id_consumo_diario_fkey" FOREIGN KEY ("id_consumo_diario") REFERENCES "consumo_diario"("id_consumo_diario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_diario_insumo" ADD CONSTRAINT "consumo_diario_insumo_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_insumo" ADD CONSTRAINT "movimiento_insumo_id_consumo_diario_fkey" FOREIGN KEY ("id_consumo_diario") REFERENCES "consumo_diario"("id_consumo_diario") ON DELETE SET NULL ON UPDATE CASCADE;
