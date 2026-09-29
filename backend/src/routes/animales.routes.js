import { Router } from "express";
import {
    getAnimales,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal
} from "../controllers/animales.controller.js";