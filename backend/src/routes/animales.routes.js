import { Router } from "express";
import { recibirFotosAnimal } from "../middlewares/upload.middleware.js";
import {
    getAnimales,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    subirFotosAnimal,
    eliminarFotoAnimal
} from "../controllers/animales.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createAnimalSchema,
    updateAnimalSchema,
    filterAnimalSchema,
}from "../schemas/animales.schema.js";
import { idParamSchema, fotoParamSchema } from "../schemas/idParam.schema.js";
import { createAdopcion } from "../controllers/adopciones.controller.js";
import { createAdopcionSchema } from "../schemas/adopciones.schema.js";

const router = Router();

router.get("/", validate(filterAnimalSchema, "query"), getAnimales);
router.get("/:id", validate(idParamSchema, "params"), getAnimalById);
router.post("/", validate(createAnimalSchema, "body"), createAnimal);
router.put("/:id", validate(idParamSchema, "params"), validate(updateAnimalSchema, "body"), updateAnimal);
router.delete("/:id", validate(idParamSchema, "params"), deleteAnimal);

// La adopción es una acción sobre un animal concreto, por eso va anidada
router.post("/:id/adopcion", validate(idParamSchema, "params"), validate(createAdopcionSchema, "body"), createAdopcion);

// Fotos del animal (carrusel)
// Subir una o varias fotos (multipart/form-data, campo "fotos", hasta 5 por vez)
router.post("/:id/fotos", validate(idParamSchema, "params"), recibirFotosAnimal, subirFotosAnimal);
// Eliminar una foto (DELETE: solo Admin y Veterinaria, lo controla requireEdicion)
router.delete("/:id/fotos/:idFoto", validate(fotoParamSchema, "params"), eliminarFotoAnimal);

export default router;