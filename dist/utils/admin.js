import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
class AdminGenerator {
    constructor() {
        this.prisma = new PrismaClient();
    }
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    async checkAdminExists() {
        const adminCount = await this.prisma.users.count({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'ADMIN' }
                ]
            }
        });
        return adminCount > 0;
    }
    async generateAdmin() {
        const adminExists = await this.checkAdminExists();
        if (adminExists) {
            console.log('Admin đã tồn tại. Bỏ qua quá trình tạo.');
            return null;
        }
        const hashedPassword = await this.hashPassword(process.env.ADMIN_PASSWORD || 'luuluandbot');
        const admin = await this.prisma.users.create({
            data: {
                username: 'superadmin',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            }
        });
        console.log('Tài khoản admin đã được tạo:');
        console.log(`Username: ${admin.username}`);
        console.log(`Mật khẩu: ${process.env.ADMIN_PASSWORD || 'luuluandbot'}`);
        return {
            username: admin.username,
            rawPassword: process.env.ADMIN_PASSWORD || 'luuluandbot'
        };
    }
    async close() {
        await this.prisma.$disconnect();
    }
}
async function initAdmin() {
    const generator = new AdminGenerator();
    try {
        await generator.generateAdmin();
    }
    catch (error) {
        console.error('Lỗi tạo admin:', error);
    }
    finally {
        await generator.close();
    }
}
initAdmin();
