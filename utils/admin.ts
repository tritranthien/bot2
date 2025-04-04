import { PrismaClient, users as User } from '@prisma/client'
import bcrypt from 'bcrypt'

interface AdminCredentials {
    username: string;
    rawPassword: string;
}

class AdminGenerator {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient()
    }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds: number = 12
        return await bcrypt.hash(password, saltRounds)
    }

    private async checkAdminExists(): Promise<boolean> {
        const adminCount: number = await this.prisma.users.count({
            where: { 
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'ADMIN' }
                ]
            }
        })
        return adminCount > 0
    }

    async generateAdmin(): Promise<AdminCredentials | null> {
        const adminExists: boolean = await this.checkAdminExists()
        if (adminExists) {
            console.log('Admin đã tồn tại. Bỏ qua quá trình tạo.')
            return null
        }

        const hashedPassword: string = await this.hashPassword(process.env.ADMIN_PASSWORD || 'luuluandbot')

        const admin: User = await this.prisma.users.create({
            data: {
                username: 'superadmin',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            }
        })

        console.log('Tài khoản admin đã được tạo:')
        console.log(`Username: ${admin.username}`)
        console.log(`Mật khẩu: ${process.env.ADMIN_PASSWORD || 'luuluandbot'}`)

        return {
            username: admin.username,
            rawPassword: process.env.ADMIN_PASSWORD || 'luuluandbot'
        }
    }

    async close(): Promise<void> {
        await this.prisma.$disconnect()
    }
}

async function initAdmin(): Promise<void> {
    const generator: AdminGenerator = new AdminGenerator()
    try {
        await generator.generateAdmin()
    } catch (error) {
        console.error('Lỗi tạo admin:', error)
    } finally {
        await generator.close()
    }
}

initAdmin();
