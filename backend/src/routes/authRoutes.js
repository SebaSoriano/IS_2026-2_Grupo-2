import { Router } from 'express';
import { login, register, logout } from '../controllers/authController.js';

const router = Router();

router.use("/login", login);
router.use("/logout", logout);
router.use("/register", register);

export default router;