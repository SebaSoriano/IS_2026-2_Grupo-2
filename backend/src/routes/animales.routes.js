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

const router = Router();

router.get("/", validate(filterAnimalSchema, "query"), getAnimales);
router.get("/:id", validate(idParamSchema, "params"), getAnimalById);
router.post("/", validate(createAnimalSchema, "body"), createAnimal);
router.put("/:id", validate(idParamSchema, "params"), validate(updateAnimalSchema, "body"), updateAnimal);
router.delete("/:id", validate(idParamSchema, "params"), deleteAnimal);

export default router;