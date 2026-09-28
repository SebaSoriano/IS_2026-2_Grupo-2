-- CreateTable
CREATE TABLE "donaciones" (
    "id_donacion" SERIAL NOT NULL,
    "tipo_donacion" VARCHAR(100) NOT NULL,
    "monto_donacion" INTEGER,
    "fecha_donacion" TIMESTAMP(3) NOT NULL,
    "rut_usuario" TEXT NOT NULL,

    CONSTRAINT "donaciones_pkey" PRIMARY KEY ("id_donacion")
);

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
