// commands/newchat.ts
import '../../utils/logger.js';
export default {
    name: 'newchat',
    description: 'Start a new AI conversation. 🤖',
    async execute({ message, args, config, logModAction, sendEmbedMessage, client, model, chatM }) {
        const userId = message.author.id;
        try {
            // Tạo một cuộc trò chuyện mới
            await chatM.createNewChat(userId);
            // Gửi xác nhận
            await message.reply('💬 Đã tạo cuộc trò chuyện mới. Bạn có thể bắt đầu trò chuyện với lệnh `!ai`.');
            // Ghi log
            console.log(`💬 User ${message.author.tag} (${userId}) đã tạo cuộc trò chuyện mới.`);
            // LOẠI BỎ phần xóa lệnh của người dùng
            // const fetchedMessage = await message.channel.messages.fetch(message.id).catch(() => null);
            // if (fetchedMessage) {
            //     await message.delete();
            // }
        }
        catch (error) {
            console.error(`🆘 Lỗi khi tạo cuộc trò chuyện mới: ${error.message}`);
            message.reply('🆘 Có lỗi xảy ra khi tạo cuộc trò chuyện mới. Vui lòng thử lại sau. 🆘');
        }
    },
};
