import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

config();

const commands = [];
const commandsDir = path.resolve('./services/slashCommands');
const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  const fileUrl = pathToFileURL(filePath).href;

  const command = await import(fileUrl);
  if ('data' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Lệnh "${file}" không có 'data', bỏ qua.`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');

try {
  console.log('🔃 Đăng ký Slash Commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID || '', process.env.GUILD_ID || ''),
    { body: commands }
  );
  console.log('✅ Đã đăng ký thành công!');
} catch (error) {
  console.error('❌ Lỗi khi đăng ký:', error);
}
