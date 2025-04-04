import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Message } from "discord.js";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
import { ExecuteParams } from "./types.js"

export default {
    name: "logs",
    description: "Lấy file log mới nhất từ thư mục logs 📝",
    async execute({message, args, config}: ExecuteParams): Promise<void> {
        const logFilePath = path.join(__dirname, "../logs/app.log");

        try {
            // Check if file exists using async method
            await fs.access(logFilePath);
            
            // Send file log to Discord
            if ('send' in message.channel) {
                message.channel.send({
                    content: "📝 Đây là log mới nhất:",
                    files: [logFilePath]
                });
            }
        } catch (error) {
            await message.reply("Không tìm thấy file log nào. 😵");
        }
    }
};
