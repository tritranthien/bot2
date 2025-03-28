require('dotenv').config();
require('./utils/logger');
require('./server2');
const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('./config.json');
const { logModAction, sendEmbedMessage } = require('./utils/helpers');
const dbHandler = require('./utils/database');
const { scheduleNextMessage } = require('./utils/schedule');
const { log } = require('console');
let getChannelId;
if (process.env.APP_ENV === 'local') {
  ({ getChannelId } = require("./utils/sddatabase3.js"));
} else {
  ({ getChannelId } = require("./utils/database.js"));
}


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
let hasSentMessage = false;
client.once('ready', () => {
  console.log(`🤖 Bot đã sẵn sàng! Đăng nhập với tên ${client.user.tag}`);
  client.user.setActivity('!help để xem lệnh', { type: 'WATCHING' });
  if (!hasSentMessage) {
    sendDeployMessage(); // Gọi hàm gửi tin nhắn
    hasSentMessage = true; // Đánh dấu đã gửi tin nhắn
  }
  // Khởi tạo database
  dbHandler.initDb();
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

function isProductionUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    return !(hostname === "localhost" || hostname === "127.0.0.1");
  } catch {
    return false; // Nếu URL không hợp lệ, coi như localhost
  }
}

async function sendDeployMessage() {
  const APP_URL = process.env.APP_URL || "http://localhost:3000";
  if (isProductionUrl(APP_URL)) {
    try {
      const channelId = await getChannelId();
      const channel = await client.channels.fetch(channelId);
      console.log(channelId);

      if (channel) {
        const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
        await channel.send(`🚀 Bot đã deploy lúc: **${now}** (GMT+7)`);
        console.log(`🚀 Bot đã deploy lúc: ${now} VN`);
      } else {
        console.error("❌ Không tìm thấy kênh.");
      }
    } catch (error) {
      console.error("❌ Lỗi khi gửi tin nhắn:", error);
    }
  }
}

// Import các lệnh
const commandFiles = fs.readdirSync('./commands')
  .filter(file => file.endsWith('.js') && !file.startsWith('_'));

const commands = new Collection();

for (const file of commandFiles) {
  const filePath = `./commands/${file}`;
  delete require.cache[require.resolve(filePath)];
  const command = require(filePath);
  commands.set(command.name, command);
  console.log(`✅ Loaded command: ${command.name}`);
}

// Xử lý tin nhắn
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args, config, logModAction, sendEmbedMessage, client, model);
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
process.on('SIGINT', () => {
  console.log('Bot đang tắt...');
  dbHandler.closeDb();
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('Bot đang tắt...');
  dbHandler.closeDb();
  process.exit(0);
});