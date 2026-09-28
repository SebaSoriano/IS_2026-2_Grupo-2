-- CreateTable
CREATE TABLE "adopciones" (
    "fecha_adopcion" TIMESTAMP(3) NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "id_animal" INTEGER NOT NULL,
    "id_adoptante" INTEGER NOT NULL,

    CONSTRAINT "adopciones_pkey" PRIMARY KEY ("id_usuario","id_animal","id_adoptante")
);

-- AddForeignKey
ALTER TABLE "adopciones" ADD CONSTRAINT "adopciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adopciones" ADD CONSTRAINT "adopciones_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adopciones" ADD CONSTRAINT "adopciones_id_adoptante_fkey" FOREIGN KEY ("id_adoptante") REFERENCES "adoptante"("id_adoptante") ON DELETE RESTRICT ON UPDATE CASCADE;
