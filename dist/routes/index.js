import { authenticateUser } from "../middlewares/auth.middleware.js";
import AuthRoute from "./auth.js";
import HomeRoute from "./home.js";
import UserRoute from "./user.js";
import SettingRoute from "./setting.js";
import DiscordRoute from "./discord.js";
import { HomeController } from '../controllers/Home.controller.js';
import { DiscordController } from '../controllers/Discord.controller.js';
const homeController = new HomeController();
const discordController = new DiscordController();
export const Route = (app) => {
    app.use('/auth', AuthRoute);
    app.get('/login', (req, res) => {
        const token = req.cookies.accessToken;
        if (token) {
            res.redirect("/dashboard");
        }
        res.render('pages/login', {
            title: 'Đăng nhập',
            activePage: 'login',
            layout: false
        });
    });
    app.use(authenticateUser);
    app.get('/', (req, res) => {
        res.redirect("/dashboard");
    });
    app.get('/update-password', (req, res) => {
        res.render('pages/user/update_password', {
            title: 'Cập nhật mật khẩu',
            activePage: 'users',
        });
    });
    app.get('/features', discordController.index.bind(discordController));
    app.use('/dashboard', HomeRoute);
    app.use('/users', UserRoute);
    app.use('/settings', SettingRoute);
    app.use('/discord', DiscordRoute);
};
