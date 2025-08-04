import { AuthController } from "../controllers/Auth.controller.js";
import { Router } from 'express';
const Auth = new AuthController();
const router = Router();
router.post('/login', Auth.login);
router.post('/logout', Auth.logout);
export default router;
