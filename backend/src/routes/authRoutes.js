import { Router } from 'express';
import { login, register, logout } from '../controllers/authController.js';

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);

export default router;