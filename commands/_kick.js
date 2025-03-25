// commands/kick.js
module.exports = {
    name: 'kick',
    description: 'Kick a user from the server.',
    async execute(message, args, config, logModAction) {
        if (!message.member.permissions.has('KickMembers')) {
            return message.reply('Bạn không có quyền sử dụng lệnh này.');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Bạn cần tag người dùng cần kick.');
        }

        if (!member.kickable) {
            return message.reply('Tôi không thể kick người dùng này.');
        }

        const reason = args.slice(1).join(' ') || 'Không có lý do';

        try {
            await member.kick(reason);
            message.channel.send(`:boot: Đã kick **${member.user.tag}**. Lý do: ${reason}`);
            logModAction(message.guild, 'Kick', message.author, member.user, reason, config);
        } catch (error) {
            console.error(error);
            message.reply('Có lỗi xảy ra khi kick người dùng.');
        }
    },
};