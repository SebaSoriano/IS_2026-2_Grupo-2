-- CreateTable
CREATE TABLE "Insumo" (
    "id" SERIAL NOT NULL,
    "tipo_insumo" VARCHAR(100) NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "descripcion" VARCHAR(255),
    "cantidad" INTEGER NOT NULL,
    "rut_usuario" TEXT NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
