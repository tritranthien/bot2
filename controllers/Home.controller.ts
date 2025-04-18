import { User } from "../models/user.js";
import { BaseController } from "./Base.controller.js";
import { Response } from 'express';
import { Request } from "../interfaces/request.js";
export class HomeController extends BaseController {
    async index(req: Request, res: Response): Promise<void> {
        const users = await new User().findMany({
            where: {
                NOT: {
                    OR: [
                        { role: 'SUPER_ADMIN' },
                        { id: req.user?.id }
                    ]
                }
            },
            select: {
                id: true,
                username: true,
                role: true,
                status: true
            }
        });
        res.render('pages/home', { 
            title: 'Users',
            activePage: 'home',
            users
        });
    }
    async feature(req: Request, res: Response): Promise<void> {
        res.render('pages/feature', {
            title: 'Features',
            activePage: 'features'
        });
    }
}