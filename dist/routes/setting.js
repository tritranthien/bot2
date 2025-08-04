import { SettingController } from "../controllers/Settings.controller.js";
import { permissions } from "../middlewares/auth.middleware.js";
import { Router } from 'express';
const Setting = new SettingController();
const router = Router();
router.get('/', permissions.requireManager, Setting.index);
router.post('/save', permissions.requireManager, Setting.save);
export default router;
