export default {
    name: 'kick',
    description: 'Kick a user from the server.',
    async execute(message, args, config, logModAction) {
        if (!message.member?.permissions.has('KickMembers')) {
            await message.reply('Bạn không có quyền sử dụng lệnh này.');
            return;
        }
        const member = message.mentions.members?.first();
        if (!member) {
            await message.reply('Bạn cần tag người dùng cần kick.');
            return;
        }
        if (!member.kickable) {
            await message.reply('Tôi không thể kick người dùng này.');
            return;
        }
        const reason = args.slice(1).join(' ') || 'Không có lý do';
        try {
            await member.kick(reason);
            if ('send' in message.channel) {
                await message.channel.send(`:boot: Đã kick **${member.user.tag}**. Lý do: ${reason}`);
            }
            logModAction(message.guild, 'Kick', message.author, member.user, reason, config);
        }
        catch (error) {
            console.error(error);
            await message.reply('Có lỗi xảy ra khi kick người dùng.');
        }
    },
};
