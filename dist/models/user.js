import { config } from "../config.js";
const repoPath = config.repoPath || 'postgresql';
import { checkPassword, hashPassword } from "../utils/passHash.js";
import jwt from 'jsonwebtoken';
const { UserRepo } = await import(`../repo/${repoPath}/user.js`);
import Base from "./base.js";
export class User extends Base {
    constructor() {
        super(new UserRepo());
    }
    async signUp(username, password) {
        const existingUser = await this.repo.findFirst({ username });
        if (existingUser) {
            return {
                ok: false,
                error: "Username is already taken"
            };
        }
        const hashedPassword = await hashPassword(password);
        const result = await this.repo.save({ username, password: hashedPassword });
        return {
            ok: true,
            result
        };
    }
    async login(username, password) {
        const user = await this.repo.findFirst({ username });
        if (!user) {
            return {
                ok: false,
                error: "User not found"
            };
        }
        const isPasswordValid = await checkPassword(password, user.password);
        if (!isPasswordValid) {
            return {
                ok: false,
                error: "Invalid username/password"
            };
        }
        const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'luuluandbot', { expiresIn: '1h' });
        return {
            ok: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            accessToken
        };
    }
}
