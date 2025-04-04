import { Request, Response, Application } from 'express';
import { authenticateUser } from "../middlewares/auth.middleware.js";
import AuthRoute from "./auth.js";
import HomeRoute from "./home.js";
import UserRoute from "./user.js";
import SettingRoute from "./setting.js";
import { HomeController } from '../controllers/Home.controller.js';
const homeController: HomeController = new HomeController();

export const Route = (app: Application): void => {
    app.use('/auth', AuthRoute);
    app.get('/login', (req: Request, res: Response): void => {
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
    
    app.get('/', (req: Request, res: Response): void => {
        res.redirect("/dashboard");
    });
    app.get('/update-password', (req: Request, res: Response): void => {
        res.render('pages/user/update_password', { 
            title: 'Cập nhật mật khẩu',
            activePage: 'users',
        });
    });
    app.get('/futures', homeController.future);
    app.use('/dashboard', HomeRoute);
    app.use('/users', UserRoute);
    app.use('/settings', SettingRoute);
}