// commands/help.js
import * as fs from 'fs';
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Message } from 'discord.js';
interface Config {
    prefix: string;
}

interface Command {
    default: {
        name: string;
        description: string;
    }
}

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export default {
    name: 'help',
    description: 'Xem danh sách lệnh quản lý server. 📚',
    async execute(message: Message, args: string[], config: Config): Promise<void> {
        const commandFiles = fs.readdirSync(path.resolve(__dirname)).filter(file => file.endsWith('.ts') && !file.startsWith('_') && file !== 'help.ts');
        let helpText = '**Lệnh Quản Lý Server 📚**\n';

        for (const file of commandFiles) {
            const command: Command = await import(path.resolve(__dirname, file));
            helpText += `\`${config.prefix}${command.default.name}\` - ${command.default.description}\n`;
        }
        if ('send' in message.channel) {
            message.channel.send(helpText);
            
        }
    },
};