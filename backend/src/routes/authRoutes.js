import { Router } from 'express';
import { login, register, logout, me } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth, requireRol } from '../middlewares/auth.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

// antes de llegar al controlador, validate comprueba 
// que el body cumpla loginSchema
// login y logout son públicas: para iniciar sesión todavía no se tiene token
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

// devuelve el usuario de la sesión actual (solo si hay sesión)
router.get("/me", requireAuth, me);

// crear cuentas solo lo puede hacer un Admin que haya iniciado sesión.
// El orden importa: primero requireAuth (¿quién es?) y después requireRol (¿puede?)
router.post("/register", requireAuth, requireRol('Admin'), register);

export default router;