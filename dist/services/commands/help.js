// commands/help.js
import * as fs from 'fs';
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
export default {
    name: 'help',
    description: 'Xem danh sách lệnh quản lý server. 📚',
    async execute({ message, args, config }) {
        const commandFiles = fs.readdirSync(path.resolve(__dirname)).filter(file => file.endsWith('.js') && !file.startsWith('_') && file !== 'help.js' && file !== 'types.js');
        let helpText = '**Lệnh Quản Lý Server 📚**\n\n';
        for (const file of commandFiles) {
            try {
                const filePath = path.resolve(__dirname, file);
                const fileUrl = new URL(`file://${filePath.replace(/\\/g, '/')}`);
                const commandModule = await import(fileUrl.href);
                // Lấy command từ default export
                const command = commandModule.default;
                if (command && command.name && command.description) {
                    helpText += `\`${config.prefix}${command.name}\` - ${command.description}\n`;
                }
                else {
                    console.error(`Command in file ${file} is missing required properties:`, command);
                    helpText += `\`${config.prefix}${file.replace('.js', '')}\` - *[Thiếu thông tin lệnh]*\n`;
                }
            }
            catch (error) {
                console.error(`Error loading command from ${file}:`, error);
                helpText += `\`${config.prefix}${file.replace('.js', '')}\` - *[Lỗi khi tải lệnh]*\n`;
            }
        }
        if ('send' in message.channel) {
            message.channel.send(helpText);
        }
    },
};
