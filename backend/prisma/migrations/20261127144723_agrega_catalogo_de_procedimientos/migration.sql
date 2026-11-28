-- CreateTable
CREATE TABLE "procedimiento" (
    "id_procedimiento" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "procedimiento_pkey" PRIMARY KEY ("id_procedimiento")
);

-- CreateIndex
CREATE UNIQUE INDEX "procedimiento_nombre_key" ON "procedimiento"("nombre");