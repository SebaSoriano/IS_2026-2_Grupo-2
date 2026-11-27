-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('salida', 'devolucion');

-- CreateTable
CREATE TABLE "historial_insumo" (
    "id_historial" INTEGER NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "historial_insumo_pkey" PRIMARY KEY ("id_historial","id_insumo")
);

-- CreateTable
CREATE TABLE "movimiento_insumo" (
    "id_movimiento" SERIAL NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" VARCHAR(255) NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "rut_usuario" TEXT NOT NULL,
    "id_historial" INTEGER,

    CONSTRAINT "movimiento_insumo_pkey" PRIMARY KEY ("id_movimiento")
);

-- AddForeignKey
ALTER TABLE "historial_insumo" ADD CONSTRAINT "historial_insumo_id_historial_fkey" FOREIGN KEY ("id_historial") REFERENCES "historial_medico"("id_historial") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_insumo" ADD CONSTRAINT "historial_insumo_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_insumo" ADD CONSTRAINT "movimiento_insumo_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_insumo" ADD CONSTRAINT "movimiento_insumo_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_insumo" ADD CONSTRAINT "movimiento_insumo_id_historial_fkey" FOREIGN KEY ("id_historial") REFERENCES "historial_medico"("id_historial") ON DELETE SET NULL ON UPDATE CASCADE;