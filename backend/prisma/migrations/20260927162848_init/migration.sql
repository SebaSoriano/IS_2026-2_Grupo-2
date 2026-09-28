-- CreateTable
CREATE TABLE "Usuario" (
    "rut_usuario" TEXT NOT NULL,
    "correo" VARCHAR(100),
    "telefono" VARCHAR(15),
    "fecha_nacimiento" TIMESTAMP(3),
    "contrasena" VARCHAR(100) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("rut_usuario")
);

-- CreateTable
CREATE TABLE "Agendamiento" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fin" TIMESTAMP(3) NOT NULL,
    "rut_usuario" TEXT NOT NULL,

    CONSTRAINT "Agendamiento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Agendamiento" ADD CONSTRAINT "Agendamiento_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
