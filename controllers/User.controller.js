import { checkPassword, hashPassword } from "../utils/passHash.js";
import { User } from "../models/user.js";
import { BaseController } from "./Base.controller.js";
import { ROLE_HIERARCHY } from "../middlewares/auth.middleware.js";

export class UserController extends BaseController {
    async create(req, res) {
        const { username, password, role } = req.body;
        const hashedPassword = await hashPassword(password);
        const user = await new User().save({username, password: hashedPassword, role});
        if(!user) {
            return res.status(400).send('Tạo user thất bại');
        }
        res.redirect('/dashboard');
    }
    async update(req, res) {
        const id = req.params.id;
        if(!id) {
            return res.status(400).send('Invalid id');
        }
        const userM = new User();
        const { username, password, role } = req.body;
        const updateData = {username, password, role};
        if (password) {
            const hashedPassword = await hashPassword(password);
            updateData.password = hashedPassword;
        }
        const currentUser = req.user;
        const updateUser = await userM.findFirst({
            where: { id }
        });
        if (!updateUser) {
            return res.status(404).send('User not found');
        }
        if (ROLE_HIERARCHY[updateUser.role] >= ROLE_HIERARCHY[currentUser.role]) {
            return res.status(403).send('You are not allowed to update this user');
        }
        const user = await new User().save(updateData, id);
        res.send(user);
    }
    async delete(req, res) {
        const id = req.params.id;
        if(!id) {
            return res.status(400).send('Invalid id');
        }
        const currentUser = req.user;
        const deleteUser = await new User().findFirst({ id });
        if (!deleteUser) {
            return res.status(404).send('User not found');
        }
        if (ROLE_HIERARCHY[deleteUser.role] >= ROLE_HIERARCHY[currentUser.role]) {
            return res.status(403).send('You are not allowed to delete this user');
        }
        const user = await new User().delete(id);
        if(!user) {
            return res.status(400).send('Xóa user thất bại');
        }
        res.send(user);
    }
    async updatePassword(req, res) {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const currentUser = req.user;
        const user = await new User().findFirst({ id: currentUser.id });
        if (!user) {
            return res.status(404).send('User not found');
        }
        const isPasswordValid = await checkPassword(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(403).send('Mật khẩu hiện tại không chính xác');
        }
        if (newPassword !== confirmPassword) {
            return res.status(403).send('Mật khẩu mới và xác nhận mật khẩu không khớp');
        }

        const hashedPassword = await hashPassword(newPassword);
        const updatedUser = await new User().save({ password: hashedPassword, username: user.username }, {id: currentUser.id});
        if (!updatedUser) {
            return res.status(400).send('Cập nhật mật khẩu thất bại');
        }
        res.send(updatedUser);
    }
}