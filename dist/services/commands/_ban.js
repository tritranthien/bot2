import '../../utils/logger.js';
export default {
    name: 'ban',
    description: 'Ban a user from the server.',
    async execute(message, args, config, logModAction) {
        if (!message.member?.permissions.has('BanMembers')) {
            return message.reply('Bạn không có quyền sử dụng lệnh này.');
        }
        const member = message.mentions.members?.first();
        if (!member) {
            return message.reply('Bạn cần tag người dùng cần ban.');
        }
        if (!member.bannable) {
            return message.reply('Tôi không thể ban người dùng này.');
        }
        const reason = args.slice(1).join(' ') || 'Không có lý do';
        try {
            await member.ban({ reason });
            if ('send' in message.channel) {
                message.channel.send(`:hammer: Đã ban **${member.user.tag}**. Lý do: ${reason}`);
            }
            logModAction(message.guild, 'Ban', message.author, member.user, reason, config);
        }
        catch (error) {
            console.error(error);
            message.reply('Có lỗi xảy ra khi ban người dùng.');
        }
    },
};
