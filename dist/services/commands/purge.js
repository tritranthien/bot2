import '../../utils/logger.js';
export default {
    name: 'purge',
    description: 'Purge messages in the channel. 🗑️',
    async execute({ message, args, config, logModAction }) {
        if (!message.member?.permissions.has('ManageMessages')) {
            await message.reply('Bạn không có quyền sử dụng lệnh này.');
            return;
        }
        const amount = parseInt(args[0]) + 1;
        if (isNaN(amount) || amount <= 1 || amount > 100) {
            await message.reply('Vui lòng nhập số lượng tin nhắn hợp lệ (1-99).');
            return;
        }
        try {
            const channel = message.channel;
            const deleted = await channel.bulkDelete(amount, true);
            await Promise.all([
                channel.send(`:wastebasket: Đã xóa ${deleted.size - 1} tin nhắn.`)
                    .then(msg => setTimeout(() => msg.delete(), 5000)),
                logModAction(message.guild, 'Purge', message.member, null, `Đã xóa ${deleted.size - 1} tin nhắn trong kênh #${channel.name}`, config)
            ]);
        }
        catch (error) {
            console.error("❌ Error purge: ", error);
            if (error.code === 10008) { // Message too old
                await message.reply('Không thể xóa tin nhắn vì chúng quá cũ (>14 ngày).');
            }
            else {
                await message.reply('Có lỗi xảy ra khi xóa tin nhắn.');
            }
        }
    },
};
