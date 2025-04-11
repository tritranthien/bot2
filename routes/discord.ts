import { DiscordController } from "../controllers/Discord.controller.js";
import { Router } from 'express';

const Discord: DiscordController = new DiscordController();
const router: Router = Router();

router.get('/:guildId/members', Discord.getGuildMembers.bind(Discord));
router.get('/:guildId/members/:memberId/volt', Discord.volt.bind(Discord));

export default router;