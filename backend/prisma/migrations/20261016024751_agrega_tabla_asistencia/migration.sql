-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "rut_usuario" TEXT NOT NULL,
    "fecha" DATE NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_rut_usuario_fecha_key" ON "Asistencia"("rut_usuario", "fecha");

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
