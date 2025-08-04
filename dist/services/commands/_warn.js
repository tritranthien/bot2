import { Collection } from 'discord.js';
export default {
    name: 'warn',
    description: 'Warn a user in the server.',
    async execute(message, args, config, logModAction) {
        if (!message.member?.permissions.has('ModerateMembers')) {
            return message.reply('Bạn không có quyền sử dụng lệnh này.');
        }
        const member = message.mentions.members?.first();
        if (!member) {
            return message.reply('Bạn cần tag người dùng cần cảnh cáo.');
        }
        const reason = args.slice(1).join(' ') || 'Không có lý do';
        const warnings = message.client.warnings || new Collection();
        if (!warnings.has(member.id)) {
            warnings.set(member.id, []);
        }
        const userWarnings = warnings.get(member.id) || [];
        userWarnings.push({
            moderator: message.author.id,
            reason,
            timestamp: Date.now(),
        });
        if ('send' in message.channel) {
            message.channel.send(`:warning: **${member.user.tag}** đã bị cảnh cáo. **Số cảnh cáo hiện tại:** ${userWarnings.length}. Lý do: ${reason}`);
        }
        logModAction(message.guild, 'Cảnh cáo', message.author, member.user, reason, config);
        if (userWarnings.length >= 3) {
            const mutedRole = message.guild?.roles.cache.find(role => role.name === config.mutedRole);
            if (mutedRole) {
                await member.roles.add(mutedRole);
                if ('send' in message.channel) {
                    message.channel.send(`:mute: **${member.user.tag}** đã bị mute tự động do nhận 3 cảnh cáo.`);
                }
                logModAction(message.guild, 'Auto-Mute', message.client.user, member.user, 'Nhận 3 cảnh cáo', config);
                warnings.set(member.id, []);
            }
        }
    },
};
