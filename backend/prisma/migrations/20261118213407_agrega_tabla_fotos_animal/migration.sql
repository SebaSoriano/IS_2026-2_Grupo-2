-- CreateTable
CREATE TABLE "fotos_animal" (
    "id_foto" SERIAL NOT NULL,
    "ruta" VARCHAR(255) NOT NULL,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_animal" INTEGER NOT NULL,

    CONSTRAINT "fotos_animal_pkey" PRIMARY KEY ("id_foto")
);

-- AddForeignKey
ALTER TABLE "fotos_animal" ADD CONSTRAINT "fotos_animal_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE CASCADE ON UPDATE CASCADE;
-- Copia la foto que ya tenía cada animal a la tabla nueva, para que aparezca en el carrusel
INSERT INTO "fotos_animal" ("ruta", "id_animal")
SELECT "foto_animal", "id_animal" FROM "animales" WHERE "foto_animal" IS NOT NULL;