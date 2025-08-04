import { config } from 'dotenv';
import { REST, Routes } from 'discord.js';
config();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional
if (!token || !clientId) {
    console.error('❌ Thiếu DISCORD_TOKEN hoặc CLIENT_ID trong .env');
    process.exit(1);
}
const rest = new REST({ version: '10' }).setToken(token);
async function listCommands() {
    try {
        let commands = [];
        let scope = '';
        if (guildId) {
            commands = await rest.get(Routes.applicationGuildCommands(clientId || '', guildId));
            scope = `Guild (${guildId})`;
        }
        else {
            commands = await rest.get(Routes.applicationCommands(clientId || ''));
            scope = 'Global';
        }
        console.log(`📋 Danh sách Slash Commands (${scope}):\n`);
        if (commands.length === 0) {
            console.log('❌ Không có lệnh nào.');
            return;
        }
        for (const cmd of commands) {
            console.log(`🔸 ${cmd.name} (${cmd.id})`);
            console.log(`   📝 ${cmd.description}\n`);
        }
    }
    catch (error) {
        console.error('❌ Lỗi khi lấy danh sách lệnh:', error);
    }
}
listCommands();
