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
    async execute(message, args, config) {
        const commandFiles = fs.readdirSync(path.resolve(__dirname)).filter(file => file.endsWith('.js')  && !file.startsWith('_') && file !== 'help.js');
        let helpText = '**Lệnh Quản Lý Server 📚**\n';

        for (const file of commandFiles) {
            const command = await import(path.resolve(__dirname, file));
            helpText += `\`${config.prefix}${command.default.name}\` - ${command.default.description}\n`;
        }

        message.channel.send(helpText);
    },
};