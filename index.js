require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('./config.json');
const logger = require('./utils/logger');
const { logModAction, sendEmbedMessage } = require('./utils/helpers');

// Import các lệnh
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = new Collection();
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.name, command);
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
client.once('ready', () => {
  logger.log(`Bot đã sẵn sàng! Đăng nhập với tên ${client.user.tag}`);
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
          logger.log(`Đã tạo role ${role.name} cho server ${guild.name}`);
          guild.channels.cache.forEach(channel => {
            channel.permissionOverwrites.create(role, {
              SendMessages: false,
              AddReactions: false,
              Speak: false,
            });
          });
        });
      } catch (error) {
        logger.error(`Không thể tạo role Muted cho server ${guild.name}: ${error}`);
      }
    }
  });

  // Gửi tin nhắn định kỳ
  setInterval(() => {
    const channel = client.channels.cache.get(config.aiChannel);
    if (channel) {
      channel.send(`<@${config.sonId}>, đã tới thời gian chích điện định kỳ, đưa cổ đây,<${config.camGif}> "rẹt rẹt rẹt ....."`);
    } else {
      logger.log('Không tìm thấy kênh.');
    }
  }, 5200000);
});

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
    logger.error(error);
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