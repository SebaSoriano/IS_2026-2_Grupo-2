import { Router } from "express";
import {
    getAnimales,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal
} from "../controllers/animales.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createAnimalSchema,
    updateAnimalSchema,
    filterAnimalSchema,
}from "../schemas/animales.schema.js";
import { idParamSchema } from "../schemas/idParam.schema.js";
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

export default router;