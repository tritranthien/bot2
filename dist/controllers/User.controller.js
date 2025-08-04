import { checkPassword, hashPassword } from "../utils/passHash.js";
import { User } from "../models/user.js";
import { BaseController } from "./Base.controller.js";
import { ROLE_HIERARCHY } from "../middlewares/auth.middleware.js";
export class UserController extends BaseController {
    async create(req, res) {
        try {
            const { username, password, role } = req.body;
            if (!username || !password || !role) {
                res.status(400).send('Missing required fields');
                return;
            }
            const hashedPassword = await hashPassword(password);
            const existingUser = await new User().findFirst({ username });
            if (existingUser) {
                res.status(400).send('Username already exists');
                return;
            }
            const user = await new User().save({
                username,
                password: hashedPassword,
                role
            });
            if (!user) {
                res.status(400).send('Failed to create user');
                return;
            }
            res.redirect('/dashboard');
        }
        catch (error) {
            console.error('Error creating user:', error);
            res.status(500).send('Internal server error');
        }
    }
    async update(req, res) {
        const id = req.params.id;
        if (!id) {
            res.status(400).send('Invalid id');
            return;
        }
        const userM = new User();
        const { username, password, role } = req.body;
        const updateData = { username, role };
        if (password) {
            const hashedPassword = await hashPassword(password);
            updateData.password = hashedPassword;
        }
        const currentUser = req.user;
        const updateUser = await userM.findFirst({ id });
        if (!updateUser) {
            res.status(404).send('User not found');
            return;
        }
        if (!currentUser || ROLE_HIERARCHY[updateUser.role] >= ROLE_HIERARCHY[currentUser.role]) {
            res.status(403).send('You are not allowed to update this user');
            return;
        }
        const user = await new User().save(updateData, id);
        res.send(user);
    }
    async delete(req, res) {
        const id = req.params.id;
        if (!id) {
            res.status(400).send('Invalid id');
            return;
        }
        const currentUser = req.user;
        const deleteUser = await new User().findFirst({ id });
        if (!deleteUser) {
            res.status(404).send('User not found');
            return;
        }
        if (!currentUser || ROLE_HIERARCHY[deleteUser.role] >= ROLE_HIERARCHY[currentUser.role]) {
            res.status(403).send('You are not allowed to delete this user');
            return;
        }
        const user = await new User().delete(id);
        if (!user) {
            res.status(400).send('Xóa user thất bại');
            return;
        }
        res.send(user);
    }
    async updatePassword(req, res) {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const currentUser = req.user;
        if (!currentUser?.id) {
            res.status(401).send('Unauthorized');
            return;
        }
        const user = await new User().findFirst({ id: currentUser.id });
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        const isPasswordValid = await checkPassword(currentPassword, user.password);
        if (!isPasswordValid) {
            res.status(403).send('Mật khẩu hiện tại không chính xác');
            return;
        }
        if (newPassword !== confirmPassword) {
            res.status(403).send('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }
        const hashedPassword = await hashPassword(newPassword);
        const updatedUser = await new User().save({ password: hashedPassword, username: user.username }, { id: currentUser.id });
        if (!updatedUser) {
            res.status(400).send('Cập nhật mật khẩu thất bại');
            return;
        }
        res.send(updatedUser);
    }
}
