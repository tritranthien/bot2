import * as dotenv from 'dotenv';
import * as path from "path";
import { readdir } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from 'path';
dotenv.config();
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
import { Client, GatewayIntentBits } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Chat from "../models/chat.js";
const chatM = new Chat();

// Các service
class ConfigService {
  constructor(config) {
    this.config = config || {
      prefix: '!',
      mutedRole: 'Muted',
      modLogChannel: 'mod-log'
    };
  }

  getConfig() {
    return this.config;
  }

  getPrefix() {
    return this.config.prefix;
  }
}

class LoggerService {
  log(message) {
    console.log(message);
  }

  error(message, error) {
    console.error(message, error);
  }
}

class AIService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  getModel() {
    return this.model;
  }
}

class CommandService {
  constructor() {
    this.commands = new Map();
  }

  async loadCommands(commandFiles) {
    for (const file of commandFiles) {
      if (!file.endsWith(".js")) continue;

      try {
        const filePath = pathToFileURL(path.join(__dirname, "commands", file)).href;
        const { default: command } = await import(filePath);
        this.commands.set(command.name, command);
        console.log(`✅ Loaded command: ${command.name}`);
      } catch (error) {
        console.error(`❌ Lỗi khi load command ${file}:`, error);
      }
    }
  }

  async executeCommand(
    commandName, 
    message, 
    args, 
    config, 
    logModAction, 
    sendEmbedMessage, 
    client, 
    model
  ) {
    const command = this.commands.get(commandName);
    if (!command) return;

    await command.execute(
      {message, 
      args, 
      config, 
      logModAction, 
      sendEmbedMessage, 
      client, 
      model,
      chatM}
    );
  }
}

class ModerationService {
  constructor(client) {
    this.client = client;
  }

  logMemberJoin(member) {
    const logChannel = member.guild.channels.cache.find(
      channel => channel.name === 'mod-log'
    );
    
    if (logChannel) {
      logChannel.send(
        `:inbox_tray: **${member.user.tag}** đã tham gia server. (ID: ${member.id})`
      );
    }
  }

  logMemberLeave(member) {
    const logChannel = member.guild.channels.cache.find(
      channel => channel.name === 'mod-log'
    );
    
    if (logChannel) {
      logChannel.send(
        `:outbox_tray: **${member.user.tag}** đã rời server. (ID: ${member.id})`
      );
    }
  }

  ensureMutedRoleExists() {
    this.client.guilds.cache.forEach(guild => {
      let mutedRole = guild.roles.cache.find(role => role.name === 'Muted');
      
      if (!mutedRole) {
        try {
          guild.roles.create({
            name: 'Muted',
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
  }

  logModAction(action) {
    console.log(`Mod Action: ${action}`);
  }

  sendEmbedMessage(channel, embedOptions) {
    // Triển khai logic gửi embed message
  }
}

class ScheduleService {
  scheduleNextMessage(client) {
    // Triển khai logic lên lịch tin nhắn 
    console.log('Đã thiết lập lịch tin nhắn');
  }
}

class DiscordBotService {
  constructor(config) {
    // Cấu hình các intent cần thiết cho bot
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
      ],
    });

    // Khởi tạo các service
    this.configService = new ConfigService(config);
    this.loggerService = new LoggerService();
    this.aiService = new AIService(process.env.AI_API_KEY);
    this.commandService = new CommandService();
    this.moderationService = new ModerationService(this.client);
    this.scheduleService = new ScheduleService();
  }

  async initialize() {
    await this.loadCommands();
    this.setupEventListeners();
    await this.login();
  }

  async loadCommands() {
    try {
      const commandFiles = await readdir(path.join(__dirname, "commands"));
      await this.commandService.loadCommands(commandFiles);
    } catch (error) {
      this.loggerService.error("Lỗi khi tải lệnh:", error);
    }
  }

  setupEventListeners() {
    // Sự kiện bot sẵn sàng
    this.client.once('ready', () => {
      this.onBotReady();
    });

    // Sự kiện nhận tin nhắn
    this.client.on('messageCreate', async (message) => {
      await this.onMessageReceived(message);
    });

    // Sự kiện thành viên vào server
    this.client.on('guildMemberAdd', (member) => {
      this.moderationService.logMemberJoin(member);
    });

    // Sự kiện thành viên rời server
    this.client.on('guildMemberRemove', (member) => {
      this.moderationService.logMemberLeave(member);
    });
  }

  onBotReady() {
    this.loggerService.log(`🤖 Bot đã sẵn sàng! Đăng nhập với tên ${this.client.user.tag}`);
    
    // Đặt trạng thái hoạt động
    this.client.user.setActivity('!help để xem lệnh', { type: 'WATCHING' });

    // Tạo role Muted cho các server
    this.moderationService.ensureMutedRoleExists();

    // Lên lịch các tin nhắn
    this.scheduleService.scheduleNextMessage(this.client);
  }

  async onMessageReceived(message) {
    if (message.author.bot || !message.content.startsWith(this.configService.getPrefix())) return;

    const args = message.content.slice(this.configService.getPrefix().length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    try {
      await this.commandService.executeCommand(
        commandName, 
        message, 
        args, 
        this.configService.getConfig(),
        this.moderationService.logModAction,
        this.moderationService.sendEmbedMessage,
        this.client,
        this.aiService.getModel()
      );
    } catch (error) {
      this.loggerService.error(error);
      message.reply('Có lỗi xảy ra khi thực hiện lệnh.');
    }
  }

  async login() {
    await this.client.login(process.env.DISCORD_TOKEN);
  }
}


export default DiscordBotService;