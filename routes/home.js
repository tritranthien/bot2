import { HomeController } from "../controllers/Home.controller.js";
import express from 'express';
const Home = new HomeController();
const router = express.Router();
router.get('/', Home.index);
export default router;