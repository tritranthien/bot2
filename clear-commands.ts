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

async function clearCommands() {
  try {
    if (guildId) {
      // Xoá Slash Commands trong một guild cụ thể
      const commands = await rest.get(
        Routes.applicationGuildCommands(clientId || '', guildId)
      ) as any[];

      console.log(`🧹 Đang xoá ${commands.length} lệnh (GUILD: ${guildId})`);
      for (const cmd of commands) {
        await rest.delete(
          Routes.applicationGuildCommand(clientId || '', guildId, cmd.id)
        );
        console.log(`❌ Đã xoá lệnh: ${cmd.name}`);
      }
    } else {
      // Xoá Slash Commands toàn cục
      const commands = await rest.get(
        Routes.applicationCommands(clientId || '')
      ) as any[];

      console.log(`🧹 Đang xoá ${commands.length} lệnh toàn cục`);
      for (const cmd of commands) {
        await rest.delete(
          Routes.applicationCommand(clientId || '', cmd.id)
        );
        console.log(`❌ Đã xoá lệnh: ${cmd.name}`);
      }
    }

    console.log('✅ Đã xoá toàn bộ lệnh thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi xoá lệnh:', error);
  }
}

clearCommands();
