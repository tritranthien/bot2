import {promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export default {
    name: "logs",
    description: "Lấy file log mới nhất từ thư mục logs 📝",
    async execute(message, args, config) {
        const logFilePath = path.join(__dirname, "../logs/app.log");

        try {
            // Check if file exists using async method
            await fs.access(logFilePath);
            
            // Send file log to Discord
            await message.channel.send({
                content: "📝 Đây là log mới nhất:",
                files: [logFilePath]
            });
        } catch (error) {
            await message.reply("Không tìm thấy file log nào. 😵");
        }
    }
};
