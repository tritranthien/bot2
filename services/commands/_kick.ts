import { Message, GuildMember, Guild, User } from 'discord.js';
// commands/kick.js
interface Config {
    // Add necessary config properties
    [key: string]: any;
}

interface Command {
    name: string;
    description: string;
    execute: (message: Message, args: string[], config: Config, logModAction: LogModActionType) => Promise<void>;
}

type LogModActionType = (
    guild: Guild,
    action: string,
    moderator: User,
    target: User,
    reason: string,
    config: Config
) => void;

export default {
    name: 'kick',
    description: 'Kick a user from the server.',
    async execute(message: Message, args: string[], config: Config, logModAction: LogModActionType): Promise<void> {
        if (!message.member?.permissions.has('KickMembers')) {
            await message.reply('Bạn không có quyền sử dụng lệnh này.');
            return;
        }

        const member: GuildMember | undefined = message.mentions.members?.first();
        if (!member) {
            await message.reply('Bạn cần tag người dùng cần kick.');
            return;
        }

        if (!member.kickable) {
            await message.reply('Tôi không thể kick người dùng này.');
            return;
        }

        const reason: string = args.slice(1).join(' ') || 'Không có lý do';

        try {
            await member.kick(reason);
            if ('send' in message.channel) {
                await message.channel.send(`:boot: Đã kick **${member.user.tag}**. Lý do: ${reason}`);
            }
            logModAction(message.guild!, 'Kick', message.author, member.user, reason, config);
        } catch (error) {
            console.error(error);
            await message.reply('Có lỗi xảy ra khi kick người dùng.');
        }
    },
} as Command;
