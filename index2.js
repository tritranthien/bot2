import * as dotenv from 'dotenv';
import * as path from "path";
import { readdir } from "fs/promises";
dotenv.config();
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from 'path';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
import "./utils/logger.js";
import "./index.js"
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import  { GoogleGenerativeAI } from '@google/generative-ai';
import  { config } from "./config.js"
import { logModAction, sendEmbedMessage } from './utils/helpers.js';
import { scheduleNextMessage } from './utils/schedule.js';

// Khởi tạo client và AI
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
});
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
client.warnings = new Collection();

// Khởi động bot
client.once('ready', () => {
  console.log(`🤖 Bot đã sẵn sàng! Đăng nhập với tên ${client.user.tag}`);
  client.user.setActivity('!help để xem lệnh', { type: 'WATCHING' });
  // Đảm bảo mỗi server có role Muted
  client.guilds.cache.forEach(guild => {
    let mutedRole = guild.roles.cache.find(role => role.name === config.mutedRole);
    if (!mutedRole) {
      try {
        guild.roles.create({
          name: config.mutedRole,
          permissions: [],
        }).then(role => {
          console.log(`Đã tạo role ${role.name} cho server ${guild.name}`);
          guild.channels.cache.forEach(channel => {
            channel.permissionOverwrites.create(role, {
              SendMessages: false,
              AddReactions: false,
              Speak: false,
            });
          });
        });
      } catch (error) {
        console.error(`Không thể tạo role Muted cho server ${guild.name}: ${error}`);
      }
    }
  });
  scheduleNextMessage(client, config);
});

// Import các lệnh
const commands = new Map();

async function loadCommands() {
  try {
      const commandFiles = await readdir(path.join(__dirname, "commands")); // Đọc danh sách file

      await Promise.all(commandFiles.map(async (file) => {
          if (!file.endsWith(".js")) return; // Bỏ qua file không phải JS

          const filePath = pathToFileURL(path.join(__dirname, "commands", file)).href;
          
          try {
              const { default: command } = await import(filePath); // Dynamic import
              commands.set(command.name, command);
              console.log(`✅ Loaded command: ${command.name}`);
          } catch (error) {
              console.error(`❌ Lỗi khi load command ${file}:`, error);
          }
      }));
  } catch (error) {
      console.error("❌ Lỗi khi đọc thư mục commands:", error);
  }
}

// Gọi hàm loadCommands() trong một IIFE
(async () => {
  await loadCommands();
})();

// Xử lý tin nhắn
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands.get(commandName);

  if (!command) return;

  try {
    await command.execute({message, args, config, logModAction, sendEmbedMessage, client, model});
  } catch (error) {
    console.error(error);
    message.reply('Có lỗi xảy ra khi thực hiện lệnh.');
  }
});

// Ghi log khi thành viên tham gia server
client.on('guildMemberAdd', member => {
  const logChannel = member.guild.channels.cache.find(channel => channel.name === config.modLogChannel);
  if (logChannel) {
    logChannel.send(`:inbox_tray: **${member.user.tag}** đã tham gia server. (ID: ${member.id})`);
  }
});

// Ghi log khi thành viên rời server
client.on('guildMemberRemove', member => {
  const logChannel = member.guild.channels.cache.find(channel => channel.name === config.modLogChannel);
  if (logChannel) {
    logChannel.send(`:outbox_tray: **${member.user.tag}** đã rời server. (ID: ${member.id})`);
  }
});

client.login(process.env.DISCORD_TOKEN);
