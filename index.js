import express from 'express';
const app = express();
import * as path from 'path';
const PORT = process.env.PORT || 3000;
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Route } from './routes/index.js';
import cookieParser from 'cookie-parser';
import expressLayouts from 'express-ejs-layouts'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ROLE_HIERARCHY } from './middlewares/auth.middleware.js';
import DiscordBotService from './services/discord.js';
dotenv.config();
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json()); // Đọc dữ liệu JSON từ request body
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ form
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser()); 
app.use(expressLayouts);
app.use((req, res, next) => {
  const token = req.cookies.accessToken;
  const originalRender = res.render;
  res.render = function(view, options = {}) {
    let user = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        user = null;
      }
    }
    options.currentUser = user || { username: 'Guest', role: 'GUEST' };
    options.activePage = options.activePage || '';
    options.title = options.title || 'Dashboard';
    options.ROLE_HIERARCHY = ROLE_HIERARCHY;
    originalRender.call(this, view, options);
  };

  next();
});
app.set('layout', 'layouts/main')
Route(app);
app.listen(PORT, () => {
  console.log(`🖥️ Server đang chạy trên port: ${PORT}`);
});
function keepAlive() {
  const url = process.env.APP_URL;
  fetch(url)
    .then(res => console.log(`✅ Ping thành công lúc: ${new Date().toISOString()}`))
    .catch(err => console.error(`❌ Ping thất bại: ${err}`));
}

setInterval(keepAlive, 12 * 60 * 1000);
const discordBot = new DiscordBotService();
discordBot.initialize().catch(console.error);