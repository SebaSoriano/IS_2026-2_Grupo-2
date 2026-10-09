import { Router } from 'express';
import { login, register, logout } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

// antes de llegar al controlador, validate comprueba 
// que el body cumpla loginSchema
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.use("/register", register);

export default router;