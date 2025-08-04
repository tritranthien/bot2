import * as dotenv from 'dotenv';
import * as path from "path";
import { readdir } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from 'path';
dotenv.config();
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
import { Client, GatewayIntentBits, TextChannel, VoiceChannel, ForumChannel, CategoryChannel, ActivityType, Events } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Chat } from "../models/chat.js";
import { sendEmbedMessage } from '../utils/helpers.js';
import { buildCombinedBookmarkEmbed, buildPaginationButtons, fetchBookmarks } from '../libs/discord.js';
import { Bookmarks } from '../models/bookmark.js';
import * as bookmarkAdd from './slashCommands/bookmark-add.js';
import * as bookmarkDelete from './slashCommands/bookmark-delete.js';
import * as bookmarks from './slashCommands/bookmarks.js';
import * as voteChoice from './slashCommands/votechoice.js';
import { agenda } from '../utils/agenda.js';
import { scheduleDailyJobs } from '../src/queues/agendaQueue.js';
const chatM = new Chat();
const stashCommandMap = {
    bookmarks: bookmarks,
    bookmark: {
        add: bookmarkAdd,
        delete: bookmarkDelete
    },
    votechoice: voteChoice
};
class ConfigService {
    constructor(config) {
        this.config = config || {
            prefix: '!',
            mutedRole: 'Muted',
            modLogChannel: 'mod-log',
            sonId: '',
            camGif: '',
            aiChannel: '',
            repoPath: '',
            channeSpamSettingKey: '',
            electricTargetKey: ''
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
            if (!file.endsWith(".js") && !file.endsWith(".ts"))
                continue;
            if (file.startsWith("types.ts") || file.startsWith("types.js"))
                continue;
            try {
                const absPath = path.join(__dirname, "commands", file);
                const fileUrl = pathToFileURL(absPath).toString();
                const { default: command } = await import(fileUrl);
                this.commands.set(command.name, command);
                console.log(`✅ Loaded command: ${command.name}`);
            }
            catch (error) {
                console.error(`❌ Lỗi khi load command ${file}:`, error);
            }
        }
    }
    async executeCommand(commandName, message, args, config, logModAction, sendEmbedMessage, client, model) {
        const command = this.commands.get(commandName);
        if (!command)
            return;
        await command.execute({
            message,
            args,
            config,
            logModAction,
            sendEmbedMessage,
            client,
            model,
            chatM
        });
    }
}
class ModerationService {
    constructor(client) {
        this.client = client;
    }
    logMemberJoin(member) {
        const logChannel = member.guild.channels.cache.find(channel => channel.name === 'mod-log');
        if (logChannel) {
            logChannel.send(`:inbox_tray: **${member.user.tag}** đã tham gia server. (ID: ${member.id})`);
        }
    }
    logMemberLeave(member) {
        const logChannel = member.guild.channels.cache.find(channel => channel.name === 'mod-log');
        if (logChannel) {
            logChannel.send(`:outbox_tray: **${member.user?.tag}** đã rời server. (ID: ${member.id})`);
        }
    }
    ensureMutedRoleExists() {
        this.client.guilds.cache.forEach((guild) => {
            let mutedRole = guild.roles.cache.find(role => role.name === 'Muted');
            if (!mutedRole) {
                try {
                    guild.roles.create({
                        name: 'Muted',
                        permissions: [],
                    }).then((role) => {
                        console.log(`Đã tạo role ${role.name} cho server ${guild.name}`);
                        guild.channels.cache.forEach((channel) => {
                            if (channel instanceof TextChannel ||
                                channel instanceof VoiceChannel ||
                                channel instanceof ForumChannel ||
                                channel instanceof CategoryChannel) {
                                channel.permissionOverwrites.create(role, {
                                    SendMessages: false,
                                    AddReactions: false,
                                    Speak: false,
                                });
                            }
                            else {
                                console.error("Channel does not support permission overwrites:", channel.type);
                            }
                        });
                    });
                }
                catch (error) {
                    console.error(`Không thể tạo role Muted cho server ${guild.name}: ${error}`);
                }
            }
        });
    }
    logModAction(action) {
        console.log(`Mod Action: ${action}`);
    }
    sendEmbedMessage(channel, author, content, color) {
        return sendEmbedMessage(channel, author, content, color);
    }
}
class ScheduleService {
}
class DiscordBotService {
    constructor(config) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildModeration,
            ],
        });
        this.configService = new ConfigService(config);
        this.loggerService = new LoggerService();
        this.aiService = new AIService(process.env.AI_API_KEY || '');
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
        }
        catch (error) {
            this.loggerService.error("Lỗi khi tải lệnh:", error);
        }
    }
    setupEventListeners() {
        this.client.once('ready', () => {
            this.onBotReady();
        });
        this.client.on('messageCreate', async (message) => {
            await this.onMessageReceived(message);
        });
        this.client.on('guildMemberAdd', (member) => {
            this.moderationService.logMemberJoin(member);
        });
        this.client.on('guildMemberRemove', (member) => {
            this.moderationService.logMemberLeave(member);
        });
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;
            switch (interaction.commandName) {
                case 'bookmarks2':
                    await stashCommandMap['bookmarks'].execute(interaction);
                    break;
                case 'bookmark':
                    const sub = interaction.options.getSubcommand();
                    if (sub) {
                        if (sub === 'add' || sub === 'delete') {
                            await stashCommandMap.bookmark[sub].execute(interaction);
                        }
                    }
                    break;
                case 'votechoice':
                    await stashCommandMap['votechoice'].execute(interaction);
                    break;
                default:
                    break;
            }
        });
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isButton())
                return;
            if (interaction.customId.startsWith('bookmark:')) {
                this.handleNextBookmarkPage(interaction);
            }
            // if (interaction.customId.startsWith('deleteBookmark:')) {
            //   this.handleDeleteBookMark(interaction);    
            // }
            if (interaction.customId.startsWith('bookmark:delete:')) {
                this.handleDeleteBookMark(interaction);
            }
        });
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isStringSelectMenu())
                return;
            switch (interaction.customId) {
                case 'bookmarks:select-tag':
                    this.handleSelectTag(interaction);
                    break;
                default:
                    break;
            }
        });
    }
    async onBotReady() {
        this.loggerService.log(`🤖 Bot đã sẵn sàng! Đăng nhập với tên ${this.client.user?.tag}`);
        this.client.user?.setActivity('!help để xem lệnh', { type: ActivityType.Watching });
        this.moderationService.ensureMutedRoleExists();
        // this.scheduleService.scheduleNextMessage(this.client, this.configService.getConfig());
        await agenda.start();
        await scheduleDailyJobs(agenda, this.client, this.configService.getConfig());
    }
    async onMessageReceived(message) {
        if (message.author.bot || !message.content.startsWith(this.configService.getPrefix() || ''))
            return;
        const args = message.content.slice(this.configService.getPrefix()?.length || 0).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase() || '';
        try {
            await this.commandService.executeCommand(commandName, message, args, this.configService.getConfig(), this.moderationService.logModAction, this.moderationService.sendEmbedMessage, this.client, this.aiService.getModel());
        }
        catch (error) {
            this.loggerService.error('Có lỗi xảy ra khi thực hiện lệnh.', error);
            console.log(error, "Lỗi");
            message.reply('Có lỗi xảy ra khi thực hiện lệnh.');
        }
    }
    async login() {
        await this.client.login(process.env.DISCORD_TOKEN);
    }
    async handleNextBookmarkPage(interaction) {
        if (!interaction.isButton())
            return;
        const [, direction, currentPageStr, rawTag] = interaction.customId.split(':');
        const currentPage = parseInt(currentPageStr);
        const nextPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
        const tags = rawTag ? rawTag.split(',') : null;
        if (nextPage < 1) {
            interaction.reply({ content: '🚫 Không còn bookmark nào ở trang này.', ephemeral: true });
            return;
        }
        const bookmarks = await fetchBookmarks(interaction.user.id, nextPage, tags);
        if (bookmarks.length === 0) {
            interaction.reply({ content: '🚫 Không còn bookmark nào ở trang này.', ephemeral: true });
            return;
        }
        const { embed, actionRows } = buildCombinedBookmarkEmbed(bookmarks);
        const paginationRow = buildPaginationButtons(nextPage, tags);
        await interaction.update({
            content: `📄 Trang ${currentPage}`,
            embeds: embed,
            components: [...actionRows, paginationRow],
        });
    }
    async handleDeleteBookMark(interaction) {
        if (!interaction.isButton())
            return;
        const [, , bookmarkId, page = "1"] = interaction.customId.split(':');
        const bM = new Bookmarks();
        await bM.delete(bookmarkId);
        const userId = interaction.user.id;
        const bookmarks = await fetchBookmarks(userId, parseInt(page), null);
        const replyData = bookmarks.length === 0
            ? {
                content: '📭 Bạn không còn bookmark nào.',
                embeds: [],
                components: [],
            }
            : (() => {
                const { embed, actionRows } = buildCombinedBookmarkEmbed(bookmarks);
                const paginationRow = buildPaginationButtons(parseInt(page), null);
                return {
                    content: `📄 Trang ${page}`,
                    embeds: embed,
                    components: [...actionRows, paginationRow],
                };
            })();
        try {
            await interaction.editReply(replyData);
        }
        catch (error) {
            console.error('❌ Không thể editReply:', error);
        }
    }
    async handleSelectTag(interaction) {
        if (!interaction.isStringSelectMenu())
            return;
        const selected = interaction.values;
        const bM = new Bookmarks();
        const page = 1;
        let bookmarks;
        if (selected.includes('__ALL__')) {
            bookmarks = await fetchBookmarks(interaction.user.id, page, null);
        }
        else {
            bookmarks = await bM.findMany({
                where: {
                    savedByUserId: interaction.user.id,
                    guildId: interaction.guildId,
                    tags: {
                        hasSome: selected,
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * 4,
                take: 4,
            });
        }
        if (!bookmarks.length) {
            await interaction.update({
                content: '📭 Không tìm thấy bookmark nào.',
                embeds: [],
                components: [],
            });
            return;
        }
        const { embed, actionRows } = buildCombinedBookmarkEmbed(bookmarks);
        const paginationRow = buildPaginationButtons(page, selected.includes('__ALL__') ? null : selected);
        await interaction.update({
            content: `📄 Trang ${page}`,
            embeds: embed,
            components: [...actionRows, paginationRow],
        });
    }
}
export default DiscordBotService;
