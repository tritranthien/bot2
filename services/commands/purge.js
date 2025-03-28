// commands/purge.js
import '../../utils/logger.js';
export default {
    name: 'purge',
    description: 'Purge messages in the channel. 🗑️',
    async execute(message, args, config, logModAction) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('Bạn không có quyền sử dụng lệnh này.');
        }

        const amount = parseInt(args[0]) + 1;
        if (isNaN(amount) || amount <= 1 || amount > 100) {
            return message.reply('Vui lòng nhập số lượng tin nhắn hợp lệ (1-99).');
        }

        try {
            const deleted = await message.channel.bulkDelete(amount, true);
            await Promise.all([
                message.channel.send(`:wastebasket: Đã xóa ${deleted.size - 1} tin nhắn.`).then(msg => setTimeout(() => msg.delete(), 5000)),
                logModAction(message.guild, 'Purge', message.author, null, `Đã xóa ${deleted.size - 1} tin nhắn trong kênh #${message.channel.name}`, config)
            ]);
        } catch (error) {
            console.error("❌ Error purge: ", error);
            if (error.code === 10008) { // Message too old
                message.reply('Không thể xóa tin nhắn vì chúng quá cũ (>14 ngày).');
            } else {
                message.reply('Có lỗi xảy ra khi xóa tin nhắn.');
            }
        }
    },
};