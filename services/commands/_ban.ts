import '../../utils/logger.js';
import { Message, GuildMember, User, Guild } from 'discord.js';
// commands/ban.js
interface Config {
    // Add your config interface properties here
    [key: string]: any;
}

type LogModAction = (
    guild: Guild,
    action: string,
    moderator: User,
    target: User,
    reason: string,
    config: Config
) => void;

export default {
    name: 'ban',
    description: 'Ban a user from the server.',
    async execute(message: Message, args: string[], config: Config, logModAction: LogModAction): Promise<Message | void> {
        if (!message.member?.permissions.has('BanMembers')) {
            return message.reply('Bạn không có quyền sử dụng lệnh này.');
        }

        const member: GuildMember | undefined = message.mentions.members?.first();
        if (!member) {
            return message.reply('Bạn cần tag người dùng cần ban.');
        }

        if (!member.bannable) {
            return message.reply('Tôi không thể ban người dùng này.');
        }

        const reason: string = args.slice(1).join(' ') || 'Không có lý do';

        try {
            await member.ban({ reason });
            if ('send' in message.channel) {
                message.channel.send(`:hammer: Đã ban **${member.user.tag}**. Lý do: ${reason}`);
              }
            logModAction(message.guild!, 'Ban', message.author, member.user, reason, config);
        } catch (error) {
            console.error(error);
            message.reply('Có lỗi xảy ra khi ban người dùng.');
        }
    },
};