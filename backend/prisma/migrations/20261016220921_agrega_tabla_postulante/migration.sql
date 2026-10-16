-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- CreateTable
CREATE TABLE "postulante" (
    "id_postulante" SERIAL NOT NULL,
    "rut_postulante" VARCHAR(12) NOT NULL,
    "nombre_postulante" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(15) NOT NULL,
    "profesion" VARCHAR(1000) NOT NULL,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'pendiente',
    "fecha_postulacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMP(3),

    CONSTRAINT "postulante_pkey" PRIMARY KEY ("id_postulante")
);
