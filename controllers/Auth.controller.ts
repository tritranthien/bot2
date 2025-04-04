import { Request, Response } from 'express';
import { User } from "../models/user.js";
import { BaseController } from "./Base.controller.js";

interface LoginResponse {
    ok: boolean;
    accessToken?: string;
}

export class AuthController extends BaseController {
    async login(req: Request, res: Response): Promise<void> {        
        const { username, password } = req.body;
        const user: LoginResponse = await new User().login(username, password);
    
        if (user.ok) {
            const token = user.accessToken;
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "DEV",
                sameSite: "strict",
                maxAge: 3600000
            });
            
            res.redirect("/");
        } else {
            res.status(400).send('Thông tin đăng nhập không chính xác');
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        res.clearCookie("accessToken");
        res.redirect("/login");
    }
}