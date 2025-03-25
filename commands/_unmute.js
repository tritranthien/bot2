// commands/unmute.js
require('../utils/logger');

module.exports = {
    name: 'unmute',
    description: 'Unmute a user in the server.',
    async execute(message, args, config, logModAction) {
        if (!message.member.permissions.has('ModerateMembers')) {
            return message.reply('Bạn không có quyền sử dụng lệnh này.');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Bạn cần tag người dùng cần unmute.');
        }

        const mutedRole = message.guild.roles.cache.find(role => role.name === config.mutedRole);
        if (!mutedRole) {
            return message.reply('Không tìm thấy role Muted.');
        }

        if (!member.roles.cache.has(mutedRole.id)) {
            return message.reply('Người dùng này không bị mute.');
        }

        try {
            await member.roles.remove(mutedRole);
            message.channel.send(`:speaker: Đã unmute **${member.user.tag}**.`);
            logModAction(message.guild, 'Unmute', message.author, member.user, 'Đã được gỡ mute bởi người quản lý', config);
        } catch (error) {
            console.error(error);
            message.reply('Có lỗi xảy ra khi unmute người dùng.');
        }
    },
};