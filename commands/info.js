// commands/info.js
module.exports = {
    name: 'info',
    description: 'Get user information.',
    async execute(message, args, config, logModAction) {
        let user;

        if (message.mentions.users.size) {
            user = message.mentions.users.first();
        } else if (args[0]) {
            try {
                user = await message.client.users.fetch(args[0]);
            } catch (error) {
                return message.reply('Không tìm thấy người dùng với ID này. 🙈');
            }
        }

        if (!user) {
            return message.reply('Không thể tìm thấy người dùng. 🙈');
        }

        const member = message.guild.members.cache.get(user.id);
        let infoText = `**Thông tin người dùng: ${user.tag}**\nID: ${user.id}\nTạo tài khoản: ${new Date(user.createdAt).toLocaleString()}\nAvatar: ${user.displayAvatarURL({ dynamic: true })}`;

        if (member) {
            infoText += `\n**Thông tin thành viên Server 💁‍♀️:**\nBiệt danh: ${member.nickname || 'Không có'}\nTham gia server: ${new Date(member.joinedAt).toLocaleString()}\nVai trò: ${member.roles.cache.map(r => r.name).join(', ')}`;
        }

        const warnings = message.client.warnings;
        if (warnings.has(user.id)) {
            const userWarnings = warnings.get(user.id);
            infoText += `\n**Cảnh cáo:** ${userWarnings.length}`;
            userWarnings.forEach((warn, index) => {
                const moderator = message.client.users.cache.get(warn.moderator);
                infoText += `\n${index + 1}. Bởi: ${moderator ? moderator.tag : 'Unknown'} - ${new Date(warn.timestamp).toLocaleString()} - ${warn.reason}`;
            });
        }

        message.channel.send(infoText);
    },
};