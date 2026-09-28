-- CreateTable
CREATE TABLE "adoptante" (
    "id_adoptante" SERIAL NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "fecha_naciciento" TIMESTAMP(3) NOT NULL,
    "observaciones_adoptante" TEXT,

    CONSTRAINT "adoptante_pkey" PRIMARY KEY ("id_adoptante")
);
