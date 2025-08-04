// commands/mute.js
import '../../utils/logger.js';
export default {
    name: 'mute',
    description: 'Mute a user in the server.',
    async execute(message, args, config, logModAction) {
        if (!message.member?.permissions.has('ModerateMembers')) {
            message.reply('Bạn không có quyền sử dụng lệnh này.');
            return;
        }
        const member = message.mentions.members?.first();
        if (!member) {
            message.reply('Bạn cần tag người dùng cần mute.');
            return;
        }
        const minutes = parseInt(args[1]);
        if (!minutes || isNaN(minutes)) {
            message.reply('Vui lòng nhập thời gian mute hợp lệ (phút).');
            return;
        }
        const reason = args.slice(2).join(' ') || 'Không có lý do';
        const mutedRole = message.guild?.roles.cache.find(role => role.name === config.mutedRole);
        if (!mutedRole) {
            message.reply('Không tìm thấy role Muted. Vui lòng tạo role này.');
            return;
        }
        try {
            await member.roles.add(mutedRole);
            if ('send' in message.channel) {
                message.channel.send(`:mute: Đã mute **${member.user.tag}** trong **${minutes} phút**. Lý do: ${reason}`);
            }
            logModAction(message.guild, 'Mute', message.author, member.user, `${minutes} phút. Lý do: ${reason}`, config);
            setTimeout(async () => {
                if (member.roles.cache.has(mutedRole.id)) {
                    await member.roles.remove(mutedRole);
                    if ('send' in message.channel) {
                        message.channel.send(`:speaker: **${member.user.tag}** đã được unmute tự động.`);
                    }
                    logModAction(message.guild, 'Auto-Unmute', message.client.user, member.user, 'Hết thời gian mute', config);
                }
            }, minutes * 60000);
        }
        catch (error) {
            console.error(error);
            message.reply('Có lỗi xảy ra khi mute người dùng.');
        }
    },
};
