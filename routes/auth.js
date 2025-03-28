import { AuthController } from "../controllers/Auth.controller.js";
import express from 'express';
const Auth = new AuthController();
const router = express.Router();
router.post('/login', Auth.login);
router.post('/logout', Auth.logout);
export default router;