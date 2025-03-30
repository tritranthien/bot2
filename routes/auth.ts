import { AuthController } from "../controllers/Auth.controller";
import { Router } from 'express';

const Auth: AuthController = new AuthController();
const router: Router = Router();

router.post('/login', Auth.login);
router.post('/logout', Auth.logout);

export default router;