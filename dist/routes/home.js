import { HomeController } from "../controllers/Home.controller.js";
import { Router } from 'express';
const homeController = new HomeController();
const router = Router();
router.get('/', homeController.index);
export default router;
