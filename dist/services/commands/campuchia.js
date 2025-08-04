import { Setting } from '../../models/setting.js';
export default {
    name: 'campuchia',
    description: 'Chích điện...⚡⚡⚡',
    async execute({ message, args, config }) {
        const member = message.mentions.members?.first();
        const settingM = new Setting();
        const sonId = await settingM.getSetting(config.electricTargetKey);
        console.log(sonId, 'sonId', config, config.electricTargetKey);
        if (!sonId) {
            return message.reply('Không có ai được chọn để trở thành người may măn được chích điện. 🙈');
        }
        if (!member) {
            return message.reply('Không thể tìm thấy người dùng này. 🙈');
        }
        if (message.author.id === member.id) {
            return message.reply('Tự chích điện là không sao cả, mày xứng đáng bị chích điện. ⚡⚡⚡⚡⚡');
        }
        if (message.author.id === sonId) {
            return message.reply(`á à 😑, mày còn đòi chích điện người khác à 😒, mày giỏi quá <@${sonId}>, <${config.camGif}> "rẹt rẹt rẹt ..⚡..⚡..⚡."`);
        }
        console.log(member.id, sonId, 'memberid');
        if (member.id !== sonId) {
            return message.reply(`xin lỗi, ở đây chúng tôi chỉ chích điện <@${sonId}>, đúng vậy, chích nó <${config.camGif}> "rẹt rẹt rẹt ..⚡..⚡..⚡"`);
        }
        return message.reply(`á à, thằng này mày xứng đáng bị chích điện ${member} à, <${config.camGif}> hêy hêy 😠😠, "rẹt rẹt rẹt ..⚡..⚡..⚡"`);
    },
};
