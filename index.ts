import express, { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Route } from './routes/index.js';
import cookieParser from 'cookie-parser';
import expressLayouts from 'express-ejs-layouts'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ROLE_HIERARCHY } from './middlewares/auth.middleware.js';
import DiscordBotService from './services/discord.js';
import { config } from './config.js';
import './utils/logger.js';
import './services/notify.js';
import { Setting } from './models/setting.js';


dotenv.config();

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

export const __filename: string = fileURLToPath(import.meta.url);
export const __dirname: string = dirname(__filename);

interface User {
  username: string;
  role: string;
  [key: string]: any;
}

interface RenderOptions {
  currentUser?: User;
  activePage?: string;
  title?: string;
  ROLE_HIERARCHY?: typeof ROLE_HIERARCHY;
  [key: string]: any;
}
const discordBot = new DiscordBotService(config);
discordBot.initialize().catch(console.error);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.json()); // Đọc dữ liệu JSON từ request body
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ form
app.use(express.static(path.join(__dirname, '../public')));

app.use(cookieParser());
app.use(expressLayouts);
app.use((req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  const originalRender = res.render;
  res.render = function(view: string, options: RenderOptions = {}) {
    let user: User | null = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET!) as User;
      } catch (error) {
        user = null;
      }
    }
    options.currentUser = user || { username: 'Guest', role: 'GUEST' };
    options.activePage = options.activePage || '';
    options.title = options.title || 'Dashboard';
    options.ROLE_HIERARCHY = ROLE_HIERARCHY;
    const boundRender = originalRender.bind(res);
    boundRender(view, options);
  };

  next();
});

app.set('layout', 'layouts/main')
Route(app);
app.listen(PORT, () => {
  console.log(`🖥️ Server đang chạy trên port: ${PORT}`);
});

async function keepAlive(): Promise<void> {
  const url = process.env.APP_URL;
  const settingM = new Setting();
  const now = new Date();
  const nowVN = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
  );
  const hour = nowVN.getHours();
  const minute = nowVN.getMinutes();
  // 8h30 - 18h00
  const isInTimeRange = (hour === 8 && minute >= 30) || (hour > 8 && hour < 18);
  await settingM.save(
    {
      key: "keepAlive",
      value: nowVN.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    },
    {
      key: "keepAlive",
    }
  );
  if (!url) return;
  try {
    await fetch(url);
    if (isInTimeRange) {
      console.log(`✅ Ping thành công lúc: ${nowVN.toISOString()}`);
    }
  } catch (err) {
    if (isInTimeRange) {
      console.error(`❌ Ping thất bại: ${err}`);
    }
  }
}

setInterval(keepAlive, 4 * 60 * 1000);
