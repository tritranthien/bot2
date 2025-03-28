import { authenticateUser } from "../middlewares/auth.middleware.js";
import AuthRoute from "./auth.js";
import HomeRoute from "./home.js";
import UserRoute from "./user.js";
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
    app.use('/dashboard', HomeRoute);
    app.use('/user', UserRoute);
}