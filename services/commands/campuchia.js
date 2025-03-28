// commands/campuchia.js
export default {
    name: 'campuchia',
    description: 'Chích điện...⚡⚡⚡',
    async execute(message, args, config) {
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Không thể tìm thấy người dùng này. 🙈');
        }

        if (message.author.id === member.id) {
            return message.reply('Tự chích điện là không sao cả, mày xứng đáng bị chích điện. ⚡⚡⚡⚡⚡');
        }

        if (message.author.id === config.sonId) {
            return message.reply(`á à 😑, mày còn đòi chích điện người khác à 😒, mày giỏi quá <@${config.sonId}>, <${config.camGif}> "rẹt rẹt rẹt ..⚡..⚡..⚡."`);
        }

        if (member.id !== config.sonId) {
            return message.reply(`xin lỗi, ở đây chúng tôi chỉ chích điện <@${config.sonId}>, đúng vậy, chích nó <${config.camGif}> "rẹt rẹt rẹt ..⚡..⚡..⚡"`);
        }

        return message.reply(`á à, thằng này mày xứng đáng bị chích điện ${member} à, <${config.camGif}> hêy hêy 😠😠, "rẹt rẹt rẹt ..⚡..⚡..⚡"`);
    },
};